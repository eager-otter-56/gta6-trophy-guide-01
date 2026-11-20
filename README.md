# Leonida Legend — GTA VI Trophy Guide & Platinum Tracker

![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/eager-otter-56/gta6-trophy-guide-01/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/eager-otter-56/gta6-trophy-guide-01/reward.svg)

[View the bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01)

Leonida Legend is a self-contained web app that guides you to the platinum in **Grand Theft Auto VI** on PlayStation 5. It covers all **55 official trophies** and works entirely offline in a desktop browser — serve the `app/` folder and everything it needs is already there.

## Inside the guide

- **The full official list.** Every trophy with the exact name, description and grade PlayStation publishes (1 platinum, 2 gold, 6 silver, 46 bronze), plus an original guide for each one: what to do, where and how, and when it can be missed. Each card cites its sources.
- **A five-stage roadmap.** Story first; then character strands and the one-off moments; activities and gold medals; a region-by-region collectible and exploration sweep; and finally crime, property and the push to 100% — the order that keeps missable content in front of you.
- **Missable warnings.** Six trophies are flagged as missable, and each flag is justified inside its guide from the wording of the official description, so you can see the reasoning rather than take it on faith.
- **A tracker that remembers.** Tick trophies off as you earn them; progress persists in the browser via localStorage, and can be exported to a JSON file, imported back, or reset.
- **Ways to slice the list.** Filter by kind (Story, Missable, Collectibles, Activities, Exploration, Money, Miscellaneous), by grade, by earned status, or search across names, descriptions and guides.
- **A spoiler shield.** Turn it on and story trophies are sealed — no name, no description, no guide, and no search leaks — until the moment you tick them off as earned.
- **A live dashboard.** Earned count, percentage meter and per-grade tallies in the header, plus per-stage progress inside the roadmap.
- **Offline by design.** Static files only: no build step, no external requests, no images, no webfonts. The neon "Leonida nights" look is hand-written CSS.

## Screenshots

The three images in `screenshots/` are genuine renders of this app at 1280×800: the full checklist with the roadmap, the list filtered to silver trophies, and the bronze filter scrolled down the page. `shots.json` records exactly which view each file shows.

## Running it locally

Any static file server pointed at `app/` will do. With Node 22, the bundled helper is easiest:

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Use `--port <n>` for a different port. Two URL parameters exist for framing the published screenshots (see `shots.json`): `?grade=silver` preselects a grade filter and `?scroll=1400` scrolls the page before capture.

## How the entry is handed in

`main.ts` is the submission program for the make.fun bounty `gta6-trophy-guide-01`. It copies `app/` and `screenshots/` into the output directory and writes `dossier.json` using the kit's vendored library in `vendor/makefun-frontend.ts`, which is reproduced unchanged from the competition kit:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources and credits

Trophy names, descriptions and grades are the official PlayStation trophy list for Grand Theft Auto VI (PS5), as listed by **Exophase — Grand Theft Auto VI (PS5)** and **PSNProfiles — GTA VI trophy list**. The guides, roadmap, kind classifications and missable reasoning are original work written for this entry. Leonida Legend is an unofficial fan project: not affiliated with Rockstar Games or PlayStation, and it uses no official artwork, logos or fonts.

## License

MIT — see `LICENSE`.
