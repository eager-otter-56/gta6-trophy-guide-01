// Leonida Legend — client logic for the GTA VI trophy guide & tracker.
//
// The page is deliberately simple technology: this script fetches the single
// data file that sits beside it (app/data/trophies.json), paints the roadmap
// and the 55 trophy cards, and stores the player's ticks in localStorage so
// the checklist survives reloads. Nothing leaves the browser; the only
// request ever made is that one relative fetch of the data file.

'use strict';

const SAVE_KEY = 'leonida-legend-checklist-v2';
const PREF_KEY = 'leonida-legend-prefs-v2';
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const KIND_NAMES = {
  story: 'Story',
  activities: 'Activities',
  collectibles: 'Collectibles',
  exploration: 'Exploration',
  money: 'Money',
  misc: 'Miscellaneous',
};

const el = {};
for (const id of [
  'stat-earned', 'stat-pct', 'meter', 'meter-fill', 'road-list', 'q',
  'grade-sel', 'status-sel', 'spoiler-box', 'chip-row', 'shown-count',
  'missable-banner', 'card-grid', 'no-results',
  'tally-platinum', 'tally-gold', 'tally-silver', 'tally-bronze',
]) {
  el[id] = document.getElementById(id);
}

let db = null;              // parsed trophies.json
let ticks = readTicks();    // { [trophyId]: true }
let shield = readShield();  // spoiler shield on/off
const view = { text: '', kind: 'any', grade: 'any', status: 'any' };

/* ---------------------------------------------------------- persistence */

function readTicks() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
    const clean = {};
    const list = Array.isArray(raw) ? raw : Object.keys(raw || {});
    for (const value of list) {
      const id = Number(value);
      if (Number.isInteger(id) && id >= 1 && id <= 55) clean[id] = true;
    }
    return clean;
  } catch {
    return {};
  }
}

function writeTicks() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(Object.keys(ticks).map(Number)));
}

function readShield() {
  try {
    return Boolean(JSON.parse(localStorage.getItem(PREF_KEY) || '{}').shield);
  } catch {
    return false;
  }
}

function writeShield() {
  localStorage.setItem(PREF_KEY, JSON.stringify({ shield }));
}

/* ------------------------------------------------------------- helpers */

const has = (trophy) => Boolean(ticks[trophy.id]);

// A story trophy is sealed while the shield is on and it is not yet earned:
// its name, description and guide are withheld from the page entirely.
const sealed = (trophy) => shield && trophy.kind === 'story' && !has(trophy);

function passesView(trophy) {
  if (view.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (view.kind !== 'any' && trophy.kind !== view.kind) {
    return false;
  }
  if (view.grade !== 'any' && trophy.grade !== view.grade) return false;
  if (view.status === 'done' && !has(trophy)) return false;
  if (view.status === 'todo' && has(trophy)) return false;
  if (view.text) {
    if (sealed(trophy)) return false; // sealed trophies never surface via search
    const hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide + ' ' + trophy.kind).toLowerCase();
    if (!hay.includes(view.text)) return false;
  }
  return true;
}

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ------------------------------------------------------------- painting */

function paintDashboard() {
  const all = db.trophies;
  const done = all.filter(has).length;
  const pct = Math.round((done / all.length) * 100);
  el['stat-earned'].textContent = done;
  el['stat-pct'].textContent = pct + '%';
  el['meter-fill'].style.width = pct + '%';
  el['meter'].setAttribute('aria-valuenow', String(done));
  for (const grade of GRADES) {
    const got = all.filter((t) => t.grade === grade && has(t)).length;
    el['tally-' + grade].textContent = got + '/' + GRADE_TOTALS[grade];
  }
  const flags = all.filter((t) => t.missable);
  const open = flags.filter((t) => !has(t)).length;
  el['missable-banner'].textContent = open > 0
    ? '⚠ ' + open + ' of ' + flags.length + ' missable trophies are still out there — they carry the pink flag below and are gathered into Stage 2 of the roadmap.'
    : 'Every missable trophy is earned. Nothing left in Leonida can be missed.';
}

function paintRoadmap() {
  const byId = new Map(db.trophies.map((t) => [t.id, t]));
  const items = db.roadmap.map((stage) => {
    const li = node('li', 'road-step');
    const doneCount = stage.trophies.filter((id) => ticks[id]).length;
    if (doneCount === stage.trophies.length) li.classList.add('road-step-done');

    const head = node('div', 'road-step-head');
    head.append(
      node('span', 'road-step-num', 'Stage ' + stage.stage),
      node('span', 'road-step-count', doneCount + ' / ' + stage.trophies.length + ' earned'),
    );
    const names = stage.trophies.map((id) => byId.get(id)).filter(Boolean);
    const title = node('h3', 'road-step-title', stage.title);
    const summary = node('p', 'road-step-summary', stage.summary);
    const list = node('p', 'road-step-names', names.map((t) => t.name).join(' · '));
    li.append(head, title, summary, list);
    return li;
  });
  el['road-list'].replaceChildren(...items);
}

function makeCard(trophy) {
  const card = node('article', 'card card-' + trophy.grade);
  if (has(trophy)) card.classList.add('card-done');
  card.dataset.trophyId = trophy.id;

  const badges = node('div', 'card-badges');
  badges.append(
    node('span', 'badge badge-' + trophy.grade, trophy.grade),
    node('span', 'card-kind', KIND_NAMES[trophy.kind] || trophy.kind),
  );
  if (trophy.missable) badges.append(node('span', 'badge badge-missable', 'Missable'));
  const num = node('span', 'card-num', 'No. ' + trophy.id);
  badges.append(num);
  card.append(badges);

  if (sealed(trophy)) {
    card.classList.add('card-sealed');
    card.append(
      node('h3', 'card-name', 'Sealed story trophy'),
      node('p', 'card-desc', 'Its name and description are hidden by the spoiler shield.'),
      node('p', 'card-sealed-note', 'Earn it in the game, tick it off below, and its guide is revealed here.'),
    );
  } else {
    card.append(
      node('h3', 'card-name', trophy.name),
      node('p', 'card-desc', trophy.description),
    );
    const fold = node('details', 'card-fold');
    const summary = node('summary', '', 'How to earn it');
    const guide = node('p', 'card-guide', trophy.guide);
    const cite = node('p', 'card-cite', trophy.sources);
    fold.append(summary, guide, cite);
    card.append(fold);
  }

  const tickLabel = node('label', 'card-tick');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = has(trophy);
  box.addEventListener('change', () => {
    if (box.checked) ticks[trophy.id] = true;
    else delete ticks[trophy.id];
    writeTicks();
    paint();
  });
  tickLabel.append(box, document.createTextNode(has(trophy) ? 'Earned — nice work' : 'I have earned this'));
  card.append(tickLabel);
  return card;
}

function paintList() {
  const visible = db.trophies.filter(passesView);
  el['card-grid'].replaceChildren(...visible.map(makeCard));
  el['no-results'].hidden = visible.length !== 0;
  el['shown-count'].textContent = 'Showing ' + visible.length + ' of ' + db.trophies.length + ' trophies';
}

function paint() {
  paintDashboard();
  paintRoadmap();
  paintList();
}

/* ------------------------------------------------------- export / import */

function downloadExport() {
  const payload = {
    app: 'leonida-legend',
    format: 2,
    exportedAt: new Date().toISOString(),
    earnedIds: Object.keys(ticks).map(Number).sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-legend-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Accepts this app's export shape ({earnedIds:[...]}), the simpler
// {earned:[...]} shape, a bare array of ids, or an {id: true} map.
function idsFromImport(text) {
  const parsed = JSON.parse(text);
  const ids = new Set();
  const take = (value) => {
    const id = Number(value);
    if (Number.isInteger(id) && id >= 1 && id <= 55) ids.add(id);
  };
  if (Array.isArray(parsed)) {
    parsed.forEach(take);
  } else if (parsed && Array.isArray(parsed.earnedIds)) {
    parsed.earnedIds.forEach(take);
  } else if (parsed && Array.isArray(parsed.earned)) {
    parsed.earned.forEach(take);
  } else if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) if (value) take(key);
  } else {
    throw new Error('not a progress file');
  }
  return ids;
}

/* -------------------------------------------------------------- wiring */

function wireUp() {
  el['q'].addEventListener('input', () => {
    view.text = el['q'].value.trim().toLowerCase();
    paintList();
  });
  el['grade-sel'].addEventListener('change', () => {
    view.grade = el['grade-sel'].value;
    paintList();
  });
  el['status-sel'].addEventListener('change', () => {
    view.status = el['status-sel'].value;
    paintList();
  });
  el['spoiler-box'].checked = shield;
  el['spoiler-box'].addEventListener('change', () => {
    shield = el['spoiler-box'].checked;
    writeShield();
    paintList();
  });
  el['chip-row'].addEventListener('click', (event) => {
    const chip = event.target.closest('button[data-filter]');
    if (!chip) return;
    view.kind = chip.dataset.filter;
    for (const c of el['chip-row'].querySelectorAll('.chip')) {
      c.classList.toggle('chip-on', c === chip);
    }
    paintList();
  });
  document.getElementById('btn-export').addEventListener('click', downloadExport);
  document.getElementById('file-import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const ids = idsFromImport(await file.text());
      ticks = {};
      for (const id of ids) ticks[id] = true;
      writeTicks();
      paint();
    } catch {
      alert('That file is not a Leonida Legend progress export, so nothing was imported.');
    }
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Erase every trophy tick saved in this browser?')) return;
    ticks = {};
    writeTicks();
    paint();
  });
}

// Pressing "/" anywhere outside a form field jumps to the search box,
// as promised by the hint above the trophy list.
document.addEventListener('keydown', (event) => {
  if (event.key !== '/') return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  event.preventDefault();
  el['q'].focus();
});

// shots.json drives two of the published screenshots through the URL:
// ?grade=silver preselects the grade filter, ?scroll=1400 scrolls down.
function applyUrl() {
  const params = new URLSearchParams(location.search);
  const grade = params.get('grade');
  if (grade && GRADES.includes(grade)) {
    view.grade = grade;
    el['grade-sel'].value = grade;
  }
  const y = Number(params.get('scroll'));
  if (Number.isFinite(y) && y > 0) {
    // Jump instantly: the stylesheet's smooth scrolling would otherwise
    // still be animating when a screenshot is taken of this view.
    requestAnimationFrame(() => setTimeout(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
    }, 120));
  }
}

async function boot() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    db = await response.json();
  } catch {
    el['no-results'].hidden = false;
    el['no-results'].textContent = 'The trophy data (data/trophies.json) could not be loaded. Serve the app/ folder over HTTP — for example with `node serve.ts` — and reload this page.';
    return;
  }
  db.trophies.sort((a, b) => a.id - b.id);
  wireUp();
  applyUrl();
  paint();
}

boot();
