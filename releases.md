# Verze hry Matěj a Zlatá poušť

Přehled toho, co přinesla každá verze, a schválený plán dalších verzí. Nejnovější verze je nahoře.
Hra běží na https://miloslavpansky.github.io/matejovo-hra/ a každá verze se tam nasadí automaticky
po pushi do `main`.

Stav: ✅ hotovo · 🛠️ rozpracováno · 📋 naplánováno

---

## 0.6 · Kraje 2 až 5 a návrat domů 📋

Schváleno 21. 11. 2026.

### Nové kraje (každý 10 levelů po 480 blocích, checkpoint zhruba po 60 blocích)
Každý kraj začíná lehčeji, než skončil ten předchozí. Obtížnost roste pozvolna a novinkou jsou hlavně
nové nástrahy, ne větší hustota nepřátel.

- **Kraj 2 · Rudý kaňon:** rudé útesy, padající pískovcové bloky, supi (dají se porazit skokem).
- **Kraj 3 · Oáza Palmíra:** palmy a voda, tekutý písek (zpomaluje a hrdina se boří),
  chřestýši (dají se porazit skokem).
- **Kraj 4 · Noční poušť:** noční obloha s hvězdami a měsícem, písečná bouře, která v nárazech
  tlačí hrdinu stranou.
- **Kraj 5 · Chrám Slunce:** chrámové sloupy, kutálející se balvany a všechny dosavadní nástrahy.

### Závěr příběhu
- Poslední level kraje 5 končí u Sluneční brány: závěrečný dialog s mumií Ramzesem, který uzná
  Matějovu odvahu a bránu otevře.
- Závěrečná animace: Matěj projde bránou, vynoří se z pískoviště za domem, máma volá k večeři
  a v kapse mu zůstala jedna zlatá mince.

### Dokončení hry
- Mapa světa s pěti kraji místo dnešního výběru levelu.
- Instalace na plochu a hraní bez internetu.
- Export dlaždic do PNG, aby šly levely upravovat v editoru Tiled.
- Doladění obtížnosti podle zkušeností hráče a test na skutečném telefonu a tabletu.

### Refaktoring
Celková revize kódu, testů a dokumentace z pohledu čistoty, úspornosti, přehlednosti a efektivity.

---

## 0.5 · Obchod, tajné místnosti a odznaky ✅

21. 11. 2026

### Obchod velblouda Bedřicha
- Velbloud Bedřich s fezem ve stylu grafiky v0.2. Obchod se otevírá z menu (tlačítko Obchod nebo klávesa O)
  i po dokončení levelu (pak z něj vede tlačítko Další level).
- Nákup na dvě klepnutí: napoprvé se Bedřich zeptá, napodruhé prodá. Když chybí mince, řekne kolik.
- **Na jeden level** (platí v nejbližším levelu a spotřebují se jeho dokončením):
  - raketový batoh za 60: 3 s letu, po dopadu na zem se do půl sekundy dobije; klávesa Shift nebo
    tlačítko BATOH na mobilu, palivo ukazuje proužek pod ikonou v HUD
  - brnění za 40: vydrží jeden zásah místo srdce
  - magnet za 30: mince do vzdálenosti 5 bloků letí k Matějovi
  - mapa tajemství za 20: zlatá šipka ukáže vchod do tajné místnosti
- **Natrvalo:** pružinové boty I, II a III za 150, 300 a 500 mincí, každá úroveň skáče o kus výš.
- **Oblečky:** pět barev kšiltovky a pět barev trička po 60 mincích. Barva se dá před koupí vyzkoušet,
  koupené oblečky se dají kdykoli zdarma převléknout.
- Aktivní pomůcky jsou v HUD jako ikony pod srdíčky.

### Tajné místnosti a odznaky
- Každý z 10 levelů kraje 1 má pod zemí tajnou místnost s 9 mincemi navíc. Vchodem je propadlý písek,
  ven se vyskočí jednosměrnými prkny. Nalezené místnosti mají ve výběru levelu zlatou šipku.
- 15 odznaků (například Bez zásahu, Sběratel, Průzkumník, Krotitel, Pokladnice, Pán dun) s přehledem
  v menu (tlačítko Odznaky nebo klávesa K). Nový odznak se ukáže po dokončení levelu nebo po nákupu.

### Nastavení
- Nová obrazovka Nastavení v menu (klávesa N): zvuk, celá obrazovka, intro znovu a restart celé hry.
- Restart celé hry po potvrzení vynuluje odemčené levely, mince, nákupy, oblečky i odznaky.
  Zůstane jen nastavení zvuku.
- Celá obrazovka přes ikonu vedle zvuku (v menu i ve hře) nebo klávesu F, kde to prohlížeč dovolí
  (Safari na iPhonu to neumí). Na Androidu se zároveň zamkne orientace na šířku.

### Další změny
- Mince se dělí na mince u sebe (dají se utratit) a všechny kdy nasbírané (počítají se do odznaků).
  Uložený postup z verze 0.4 se převede automaticky.
- Batoh nemůže vyletět nad horní okraj levelu.
- Nové testy pravidel obchodu, odznaků a ukládání (`tests/rules.test.mjs`) a kontrola tajných
  místností v testech levelů.

---

## 0.4 · Deset levelů v kraji 1 ✅

21. 11. 2026

- Kraj 1 Zlaté duny má 10 levelů, každý 480 bloků se 7 checkpointy.
- Levely se skládají z 20 ručně navržených úseků v pěti stupních obtížnosti. Každý level míchá dva
  sousední stupně a levely jsou seřazené podle počtu nástrah (24 až 39), takže obtížnost roste pozvolna.
- Výběr levelu ve dvou řadách po pěti s nejlepším počtem mincí.
- Testy hlídají 10 levelů, délku 480 bloků, rozmístění checkpointů a strop obtížnosti.

## 0.3 · Intro, zvuky a nový HUD ✅

21. 11. 2026

- Oprava: postava se už neodráží od mincí.
- Levely prodloužené na 240 bloků se 3 checkpointy.
- HUD: číslo levelu, mince v levelu / mince celkem, ikony menu a zvuku pod mincemi.
- Mince celkem se ukládají po dokončení levelu.
- 8bitové zvuky a klidná hudba přes Web Audio, vypínač ikonou nebo klávesou M.
- Animované intro: pískoviště za domem, zlatý kámen, vír písku, pád tunelem, přistání v poušti.
- Plynulá obloha, oblé mraky ve dvou vrstvách, slunce s paprsky, které mrká a usmívá se.

## 0.2 · Kraj 1 s pěti levely ✅

21. 11. 2026

- Pět levelů kraje 1 se stoupající obtížností, výběr levelu a ukládání postupu do localStorage.
- Masožravé rostliny se dají porazit skokem na hlavu, nový kaktus jako překážka.
- Ostré pixelové písmo Press Start 2P místo rozmazaného textu.
- Cíl levelu je kamenná Sluneční brána.

## 0.1 · První hratelný prototyp ✅

21. 11. 2026

- Phaser 3, TypeScript a Vite, grafika generovaná kódem ve stylu návrhu v0.2.
- Jeden level s mincemi, štíry, rostlinami, propastmi, plošinami, 3 srdci, checkpointem a cílem.
- Ovládání klávesnicí i dotykem, pauza.
- Veřejný repozitář na GitHubu a CI/CD: typy, testy a sestavení u každého pushe, nasazení na GitHub Pages.
