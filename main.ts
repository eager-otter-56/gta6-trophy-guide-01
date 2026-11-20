// Entry program for "Leonida Legend", my gta6-trophy-guide-01 submission (Node 22, no dependencies).
// The guide itself lives in app/ as plain static files — open app/index.html in a browser and everything
// runs locally: no build step, no network traffic, with the trophy data and every guide held in
// app/data/trophies.json. This file's whole job is the hand-in: copy app/ and screenshots/ into the
// output directory and write /output/dossier.json there with the vendored make.fun library, so the
// judge receives the screenshots, the first-load file list and the source outline. Do not edit
// vendor/makefun-frontend.ts — the scorer expects dossier.json to be exactly what its own copy writes.
//
// What the guide offers: the 55 official PlayStation trophies for Grand Theft Auto VI, each carrying an
// original guide and its cited sources; a five-stage roadmap that ends at the platinum; missable flags
// argued from the wording of the official descriptions; filters by kind, grade and earned status plus
// full-text search; a spoiler shield that seals story trophies until they are earned; and a checklist
// that persists in the browser with export and import. The screenshots under screenshots/ are genuine
// renders of this app — shots.json records which view each one shows.
//
// To look at the guide locally, run `node serve.ts` and open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
