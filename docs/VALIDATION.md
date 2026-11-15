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
