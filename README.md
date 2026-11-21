# Matěj a Zlatá poušť

Klidná pixelová plošinovka do prohlížeče pro hráče od 7 do 9 let. Matěj propadne pískovištěm do pouště,
sbírá mince, přeskakuje štíry a masožravé rostliny a hledá cestu domů.

**Hrát:** https://miloslavpansky.github.io/matejovo-hra/

## Ovládání

| Akce | Klávesnice | Mobil a tablet |
|---|---|---|
| Běh | ← → nebo A / D | tlačítka vlevo dole |
| Skok (čím déle držíš, tím výš) | ↑, W nebo mezerník | tlačítko SKOK |
| Pauza a menu | Esc nebo P | ikona ☰ vpravo nahoře pod mincemi |
| Zvuk zapnout / vypnout | M | ikona reproduktoru vedle menu |
| Intro znovu | I (ve výběru levelu) | tlačítko Intro |

Na štíra i masožravou rostlinu se dá skočit shora. Kaktus se musí přeskočit.

Vpravo nahoře je počet mincí ve tvaru *mince v tomto levelu / mince celkem*, uprostřed nahoře
číslo levelu (například *Level 2/10*).

## Stav prototypu (verze 0.4)

Hotovo: animované intro podle příběhu (pískoviště, zlatý kámen, pád do pouště), celý první kraj
Zlaté duny s 10 levely (každý 480 bloků se 7 checkpointy, obtížnost roste jen pozvolna), výběr levelu,
běh a skok, mince, štíři, masožravé rostliny, kaktusy, propasti, plošiny, 3 srdce, Sluneční brána v cíli,
8bitové zvuky a hudba s vypínačem, usměvavé slunce, dotykové ovládání a nasazení na GitHub Pages.

Postup (odemčené levely, nejvíc mincí v levelu, mince celkem, nastavení zvuku a zhlédnuté intro) se ukládá
do `localStorage` prohlížeče, ne do cookies. Data zůstávají jen v daném prohlížeči a zařízení, neposílají
se na žádný server a smažou se spolu s daty stránky.

Zatím chybí: obchod, dialogy v levelech, další kraje a instalace jako aplikace (offline).

## Technologie

- [Phaser 3](https://phaser.io/), TypeScript a [Vite](https://vite.dev/)
- Veškerá grafika se kreslí kódem při spuštění (`src/art`), ve stylu návrhu v0.2.
- Levely jsou ve formátu [Tiled](https://www.mapeditor.org/) JSON (`public/levels`).
  Levely kraje 1 skládá skript `scripts/gen-level.mjs` z 20 ručně navržených úseků po ~50 blocích
  (štír, rostlina, kaktus, propast, plošina, kopec) v pěti stupních obtížnosti. Každý level má 8 úseků
  ze dvou sousedních stupňů a za každým úsekem kromě posledního je checkpoint. Testy v `tests/` hlídají
  přeskočitelné propasti, rozmístění checkpointů, strop obtížnosti a její plynulý růst.
- Písmo Press Start 2P se kreslí jako ostré pixely (`src/ui/PixelText.ts`), jen ve velikostech 8 a 16 px.
- Zvuky a hudba se syntetizují přes Web Audio API (`src/audio/sound.ts`), nic se nestahuje.
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
`level` (znovu vygeneruje levely kraje 1), `check` (všechno jako v CI).
