# Issue #1 – technický spike a první MVP

Ověření 15. 11. 2026. [Zadání](https://github.com/LukynovoCZ/Vetrniky/issues/1).

## Ověření zdrojů před implementací

Oficiální ZIP MMR a aktuální AIP PDF byly znovu staženy. SHA-256 přesně odpovídá exportu z 13. 11. 2026; audit je v data/verification.json. Tím je ověřena shoda vstupu, nikoliv automaticky úplnost původního importu. Lokální testy ověřují počty, unikátní ID, dvě konkrétní polohy Pcher a oddělení záměrů.

| Zdroj | Ověření a rozhodnutí |
| --- | --- |
| [MMR – vydaná Z2 ÚRP](https://www.mmr.gov.cz/cs/ministerstvo/stavebni-pravo/koncepce-a-strategie/uzemni-rozvojovy-plan/zmena-c-2-uzemniho-rozvojoveho-planu-a-souvisejici) | Stránka potvrzuje účinnost 25. 8. 2026. ZIP stejný, 49 AOV v dodaném GeoJSON. Vydaná celostátní vrstva je oddělena od návrhů a vhodnosti; není povolením jednotlivých staveb. Případné pozdější soudní změny nejsou automaticky synchronizované. |
| [ŘLP AIP ENR 5.4](https://aim.rlp.cz/ais_data/aip/data/valid/e5-4.pdf) | Stejný PDF; 175 importovaných překážek. AIP výslovně zahrnuje trvalé významné letecké překážky, běžně od 100 m AGL; neprokazuje úplnost ani aktuální provoz. Přesnost souřadnic celá vteřina. Otevřená licence nebyla doložena, podmínky hromadné redistribuce zůstávají k dořešení před veřejným provozem. |
| [ČSVE](https://www.csve.cz/instalace/instalace-v-cr/) | Tabulka k 1. 12. 2025: Pchery 100 m / 88 m, odtud maximum 144 m. AIP uvádí 138 m. Obě hodnoty zůstávají viditelné. Žádné domýšlení nábojů ostatních překážek. |
| [ČÚZK – formy poskytování](https://geoportal.cuzk.cz/Dokumenty/Formy_poskytovani_dat_ZU.pdf), [podmínky](https://www.cuzk.gov.cz/Predpisy/Podminky-poskytovani-prostor-dat-a-sitovych-sluzeb/Podminky-poskytovani-prostorovych-dat-CUZK.aspx) | DMR 5G je dostupný jako LAZ/TXT, mj. S-JTSK/Bpv; existuje i ETRS89/EVRS. Otevřená data CC BY 4.0 s atribucí. Nejde o přímou Cesium quantized-mesh nebo MapLibre raster-dem službu. Potřebuje preprocessing, dlaždice, správný CRS a vertikální datum. V MVP není implementován ani zaměněn za Terrarium. |
| [Tilezen / Terrarium](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) | Použit skutečný výškový PNG z12/2208/1385 a sousedé; výška R*256+G+B/256−32768 m. Evropa: EU-DEM, globální doplňky USGS. Přiložené kredity. Rozlišení není geodetické, vertikální datum není sjednoceno s Bpv ani WGS84 elipsoidem. |
| [ERÚ](https://eru.gov.cz/vyhledavac-licenci) | Dohledán oficiální vyhledávač licencí, neověřen strojový import přesných patek jednotlivých turbín a jeho licence. Zatím nepřidáván. |
| [OpenFreeMap](https://openfreemap.org/quick_start/), [OSM](https://www.openstreetmap.org/copyright) | Generalizované mapové dlaždice a místní kontext Pcher, ODbL + licence stylu v credits. Veřejná služba není garantované SLA. |

T.REX Maps a Minimapa jsou pouze inspirace. Jejich API, kód ani oprávnění přebírat dlaždice nebyly doloženy; žádná jejich data nejsou použita. Záměry z EIA zatím nemají ověřený import.

## Reprodukovatelné porovnání enginů

Hlavní stránka je běžící MapLibre + místní Three.js. /spike/ je samostatný CesiumJS 1.145 prototyp se stejným modelem models/turbine.gltf a stejnými českými Terrarium PNG, bez účtu ion. Nejde o výkonnostně srovnatelný hotový editor; měření se vztahuje k uvedeným scénám, ne k obecnému vítězi.

| Vlastnost | MapLibre + Three.js MVP | CesiumJS spike |
| --- | --- | --- |
| Terén | MapLibre streamuje raster-dem, od zoomu 10 geometrie; místní Three výřez 6 km / 128 buněk | CustomHeightmapTerrainProvider, WebMercator, 65 × 65 vzorků, max zdrojový zoom 12; mimo ČR zjednodušeno |
| Geodézie | Místní aproximace roviny; metry výšek a půdorysu bez zvýraznění. Bez zakřivení Země | Elipsoid WGS84, ECEF a geografické pozice; nutná transformace zdrojových výšek, v prototypu neprovedena |
| Kamera u země | Perspektiva 35–90°, 1,7 m nad stejnou triangulací jako terén; mobilní šipky | Kamera v kartografické poloze + 1,7 m, vzorek DEM na úrovni 12; není prokázáno přesné shodné povrchové LOD |
| glTF | Jeden lokální model, klony sdílejí geometrii, samostatné rozměry uzlů a rotor | Dvě instance téhož souboru, metr 1:1, bez minimumPixelSize zvětšování |
| Licence kódu | MapLibre BSD-3-Clause / Three MIT; aplikace zachovává AGPL | CesiumJS Apache-2.0; služba ion má samostatné tarify a limity |
| Provoz | Statické soubory + externí mapové/DEM/geokódovací služby | Statické soubory + verzovaný Cesium CDN a Terrarium; žádný ion token |
| Slabina | Detailní výřez se nestreamuje při chůzi za hranice; budovy mimo Pchery chybí | Pro produkci chybí správné výškové datum, plný editor a lokální balení Cesium |

**Volba pro první funkční verzi: zachovat MapLibre + Three.js.** Umožní dokončit ověřitelný editor na existujícím lehkém klientu bez migrace a účtu pro terén. Pro další fázi s dlouhými pohledy a souvislou chůzí doporučení podmíněně směřuje k Cesium; rozhodnutí změnit až po vyřešení českého výškopisu, transformací a benchmarku na telefonu. Samotná licence CesiumJS nic neříká o bezplatnosti ion. [Cesium licence](https://github.com/CesiumGS/cesium), [terrain](https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/), [heightmap API](https://cesium.com/learn/cesiumjs/ref-doc/CustomHeightmapTerrainProvider.html), [MapLibre custom layers](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/).

## Co je v MVP

Vlastní simulace má výraznou fialovou barvu a samostatnou vrstvu. Přidání do středu mapy či kliknutím, přesun kliknutím, změna souřadnic, náboje, rotoru, výkonu a natočení; odebrání; nejvýše 32 kusů. Existující překážky ani oficiální oblasti se editorem nemění. JSON import přepíše status na simulation a zdroj na user; nesmí podvrhnout schválený projekt. Před/po skrývá vlastní simulace na levé straně.

Pozorovatele lze vybrat kliknutím nebo zadat souřadnice a otevřít pohled 1,7 m. Celý scénář, stanoviště, FOV a kamera jsou ve fragmentu URL (neodesílá se HTTP serveru jako část cesty). JSON export obsahuje objekty, nikoli kameru; úplný pohled sdílejte odkazem. Import je omezen na 50 kB; URL parser na 24 000 znaků JSON a 32 objektů. Jde o rozsah zhruba ČR, nikoli polygonový test státní hranice.

Jednotný model objektu: type, status, geometry, capacity_mw, dimensions, source, source_date, positional_accuracy. Aktuální validátor přijímá pouze wind_turbine; další typy bude možné přidat verzováním kontraktu bez změny mapových vrstev.

Výkon je popisný údaj a nemění model turbíny. Natočení je uživatelský azimut rotoru od severu, nikoli meteorologický směr. Lopatka musí být nejméně 5 m nad patou. Žádné automatické posouzení povolitelnosti nebo vhodnosti, hluku, stínů či výnosu. Odborná ani terénní line-of-sight analýza není implementovaná.

## Sestavení, provoz a další etapy

Node.js 22+; žádné npm závislosti nejsou potřeba pro hlavní aplikaci. npm test; npm run build; npm run dev. Cloudflare Pages: build npm run build, výstup dist. Současný soukromý Sites projekt se nemění. Nenahrávat .cache ani původní ZIP. Kontrolní součty exportu KONTROLNI-SOUCTY.json jsou původní archivní manifest, nikoli manifest upravené verze.

Hlavní build má jednotky MiB; přesnou velikost vypíše build. Žádný placený účet nebyl založen, žádné placené služby nejsou zapnuté; měřené účtované náklady této lokální verze 0 Kč. Nejde o záruku nulových budoucích nákladů. [Cloudflare Pages limity](https://developers.cloudflare.com/pages/platform/limits/): před publikací znovu prověřit aktuální limity; build kontroluje maximální velikost souboru 25 MiB. DEM, mapové dlaždice a geokódování jsou externí požadavky mimo velikost buildu. Pro větší návštěvnost geokódování nahradit smluvní službou / vlastní instancí a globálním limitem.

Zbývá produkční DMR 5G pipeline a výškové datum, úplný registr skutečně provozovaných VTE, import doložených záměrů, souvislé streamování místního kontextu, vrstevnice a další energie. Neuzavírat issue jako úplně hotový energetický atlas.
