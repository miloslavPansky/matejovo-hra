# Matěj a Zlatá poušť

Klidná pixelová plošinovka do prohlížeče pro hráče od 7 do 9 let. Matěj propadne pískovištěm do pouště,
sbírá mince, přeskakuje štíry a masožravé rostliny a hledá cestu domů.

**Hrát:** https://miloslavpansky.github.io/matejovo-hra/

## Ovládání

| Akce | Klávesnice | Mobil a tablet |
|---|---|---|
| Běh | ← → nebo A / D | tlačítka vlevo dole |
| Skok (čím déle držíš, tím výš) | ↑, W nebo mezerník | tlačítko SKOK |
| Pauza | Esc nebo P | tlačítko II nahoře |

Na štíra se dá skočit shora. Masožravou rostlinu je potřeba přeskočit.

## Stav prototypu (verze 0.1)

Hotovo: jeden level (120 bloků), běh a skok, mince, štíři, rostliny, propasti, 3 srdce, checkpoint,
cíl, dotykové ovládání a nasazení na GitHub Pages.

Zatím chybí: obchod, příběh a dialogy, zvuky a hudba, další levely a kraje, ukládání postupu a instalace
jako aplikace (offline).

## Technologie

- [Phaser 3](https://phaser.io/), TypeScript a [Vite](https://vite.dev/)
- Veškerá grafika se kreslí kódem při spuštění (`src/art`), ve stylu návrhu v0.2.
- Levely jsou ve formátu [Tiled](https://www.mapeditor.org/) JSON (`public/levels`).
  První level vyrábí skript `scripts/gen-level.mjs`.
- CI/CD: GitHub Actions (`.github/workflows/ci-cd.yml`) u každého pushe a pull requestu ověří
  typy, testy a sestavení. Push do `main` hru nasadí na GitHub Pages.
- Návrh hry (příběh, postavy, grafika) je v `design/navrh-hry.html`.

## Vývoj

Na Windows se nic neinstaluje, všechno běží v kontejneru WSLC (`node:22-bookworm-slim`):

```powershell
$w = "C:\Program Files\WSL\wslc.exe"
# závislosti (node_modules zůstávají ve svazku WSLC)
& $w run --rm -v "${PWD}:/app" -v matejovo-hra-node-modules:/app/node_modules -w /app node:22-bookworm-slim npm ci
# vývojový server na http://localhost:5173
& $w run -d --name hra-dev -p 5173:5173 -e VITE_POLL=1 -v "${PWD}:/app" -v matejovo-hra-node-modules:/app/node_modules -w /app node:22-bookworm-slim npm run dev
# kontrola jako v CI: typy, testy, sestavení
& $w run --rm -v "${PWD}:/app" -v matejovo-hra-node-modules:/app/node_modules -w /app node:22-bookworm-slim npm run check
```

S nainstalovaným Node.js 22 stačí `npm ci`, `npm run dev` a `npm run check`.

Skripty: `dev` (vývojový server), `build` (složka `dist`), `typecheck`, `test` (kontrola levelů),
`level` (znovu vygeneruje level 1-1), `check` (všechno jako v CI).
