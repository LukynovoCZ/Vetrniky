# Vítr v krajině – 3D mapa ČR

První MVP pro [issue #1](https://github.com/LukynovoCZ/Vetrniky/issues/1). MapLibre přehled, skutečný místní 3D terén a editor vlastních větrných turbín.

## Spuštění

Node.js 22.15 nebo novější, bez instalace závislostí:

```sh
npm test
npm run build
npm run dev
```

Ve Windows PowerShell s blokovanými skripty použijte npm.cmd místo npm.

Otevřít http://127.0.0.1:8000/; Cloudflare Pages build: npm run build, výstup: dist. Neotvírat přes file://. Srovnávací Cesium prototyp je na /spike/.

## Použití

1. Vyhledejte obec či adresu nebo otevřete demonstrátor Pchery.
2. V Moje simulace přidejte dvě turbíny do středu či kliknutím a upravte jejich rozměry/polohu.
3. Otevřete Místní ISO, případně vyberte pozorovatele a Pohled 1,7 m.
4. Sdílet pohled ukládá scénář, kameru i pozorovatele do URL. Export/import JSON přenáší pouze vlastní turbíny.

Fialové objekty jsou vlastní ilustrace, nikoli doložené projekty. Oficiální oblast sama neurčuje plánované stavby. Evidence ŘLP není úplný registr provozu. Rozměry Pcher mají rozpor ČSVE 144 m vs. AIP 138 m. Místní výřez má 6 × 6 km, mimo Pchery chybí budovy/vegetace; bez transformace výškového data a odborného posouzení viditelnosti.

[Technologie, porovnání Cesium/MapLibre a ověření zdrojů](docs/ISSUE-1.md). [Původní dokumentace exportu](docs/EXPORT-README.md). Zdrojový registr: data/sources.json, audit stažených podkladů: data/verification.json. Výsledky ověření: docs/VALIDATION.md.

## Licence

Kód aplikace zachovává AGPL-3.0-or-later a autorství izomapy Adama Klatovského. Model turbine.gltf je místní schematický model v metrech. Three.js a jeho loader MIT; MapLibre BSD-3-Clause. Data mají vlastní licence a nejistoty v registru, credits/ a vendor/. Původní KONTROLNI-SOUCTY.json patří exportnímu ZIP, nikoli současným upraveným souborům.
