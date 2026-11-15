# Ověření issue #1

Průběžný záznam 15. 11. 2026.

- Ověřené SHA-256 oficiálního GML ZIP a AIP PDF: shoda s importovaným snapshotem. Nezávislé načtení XML v oficiálním GML potvrzuje 49 prvků AOV a 12 AOS.
- Prošlo 9 automatických testů scénáře, dat, skutečného glTF loaderu, geometrie a umístění pozorovatele. Výšky skutečné české DEM dlaždice byly dekódovány: rozsah 225,059 až 399,766 m.
- HTTP hlavní stránky a models/turbine.gltf vrací 200. Připnutý CesiumJS 1.145 CDN vrací 200.
- Prohlížečový host CUA není dostupný; žádost o nativní Chrome vypršela. Vykreslení, ovládání přes UI, skutečné FPS a mobilní screenshot nebyly touto kontrolou ověřeny.
- Cesium spike je implementovaný s reálným Terrarium providerem a společným glTF, ale jeho vykreslení zatím není potvrzené. Inicializační časy se zobrazují přímo v prototypu, nikoli jako smyšlený benchmark v dokumentaci.
- Původní export uvádí vlastní starší prohlížečové testy. Nejsou vydávány za testy současných změn.

## Ruční akceptační průchod

1. npm.cmd run dev; otevřít http://127.0.0.1:8000/.
2. Pchery, přidat dvě turbíny v okolí, jednu s nábojem 175 / rotorem 150, druhou 200 / 180. Zkontrolovat maxima 250 a 290 m.
3. Přesunout druhou kliknutím, změnit azimut, odebrat a importovat JSON.
4. Vybrat pozorovatele, otevřít Pohled 1,7 m, rozhlédnout se a změnit FOV.
5. Sdílet odkaz, otevřít v nové kartě a porovnat objekty i kameru.
6. Zapnout před/po, vlevo ověřit skryté vlastní simulace.
7. Otevřít /spike/, ověřit dvě 250m instance a výšku očí.
8. Zopakovat při šířce 390 px a vypnuté animaci.

## Katalog VTE a geometrické vrstvy (15. 11. 2026)

- Import 89 původních řádků, 10 neověřených návrhů rozměrů, 3 blokované řádky a 4 matematické nesoulady výkonu.
- Explicitně propojeny dvě turbíny Pcher; 88 lokalit zůstává bez ověřené vazby. Původní existing.geojson i PSV beze změn.
- Přidány skutečné DOM testy katalogového ovládání, regresní testy sdílení a matematické geometrie.
- Výchozí produkční build záměrně vylučuje data/reference. Test kontroluje i odstranění případných starých referenčních souborů z dist a odmítnutí neschváleného --with-catalog.
- Nedostupná aktuální konsolidace zákona vede k vypnutému právnímu výpočtu, nikoli k tvrzení o právně platných pásmech.
- Podrobná metodika a licence: CATALOG-CHANGELOG.md. Žádné veřejné nasazení.

- Finální sada: 26 testů (včetně inicializace celé aplikace přes testovací mapové rozhraní s katalogem i bez něj a ořezu 3D obrysů na hranici místního terénu). Živý WebGL prohlížeč tímto není ověřen.

## Špendlík a Benátky nad Jizerou

Přidán panoramatický režim, terénní profil a sférická geometrie. Ověření skutečného DEM pro vzor u zámku: 14 dlaždic, 29 ilustračních kandidátů do 40 km s horním bodem nad terénním horizontem; porovnaný nižší bod vrací 29 za terénem. Žádná z těchto čísel není potvrzením viditelnosti v zastavěném městě. Metodika a reprodukce: PIN-PANORAMA.md. Živý WebGL výstup zatím neověřen.

- Final panorama regression suite: 38 tests passed. Static build: 5.28 MiB, catalogue excluded. Real Benatky DEM sample: 14 tiles / 1,589,379 source bytes; cached numerical verification approximately 0.2 s (not a browser FPS benchmark).

## Směr pohledu ze špendlíku

Doplněna synchronní výseč a osa kamery v hlavní mapě i orientační mapce panoramatu. Nové testy ověřují azimut přes sever, původ ve špendlíku, horizontální FOV podle poměru stran, změnu zoomu, projekci skloněné kamery a aktualizaci zdrojů MapLibre. Výseč není viewshed.

- Výsledná sada po doplnění výseče: 43 testů. Kontrola zahrnuje také live callback skutečného poměru stran panoramatické kamery při změně rozměrů viewportu.
