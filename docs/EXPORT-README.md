# Vítr v krajině – první implementace

Samostatný prohlížeč pro izomapu, bez změny městského rendereru.

## Architektura a zhodnocení původního projektu

Původní `prep.py → render.html/render.mjs → dzi.py → web/app.html` připravuje podrobné městské scény v 2,3km čtvercích a převádí je do rastrů Deep Zoom. Znovu lze využít Three.js, dimetrický směr kamery (od jihozápadu, elevace 30°), přírodní barevnost, stylizaci a statický hosting. Rastry neobsahují geometrii pro změnu kamery ani výpočet zakrytí. Nepoužíváme proto městské scény k celorepublikovému renderu.

- **Celostátní přehled:** MapLibre GL, generalizované vektorové dlaždice OpenFreeMap (OSM), stínovaný Terrarium DEM (prostorová geometrie až od zoomu 10, reliéf 1 : 1), průsvitné polygony a shluky bodů. Budovy ve stylu až od zoomu 14; jednotlivé 3D budovy se v celostátním přehledu nevytvářejí. Přehled je šikmá perspektivní mapa, nikoli přesná ortografie původního městského rendereru.
- **Místní vrstva:** samostatná živá scéna Three.js, ortografická kamera nebo perspektivní kamera 1,7 m nad triangulovaným terénem. Místní scéna má 6 × 6 km, 128 × 128 buněk (46,875 m). DEM se načítá po dlaždicích z12, pro Pchery je přiložená malá cache. Metry výšek a půdorysu mají stejné měřítko. Terén, známé budovy a turbíny používají společný depth buffer.
- **Pchery:** samostatný místní balíček půdorysů a cest OSM. Lesy, voda a půdorysy se malují do textury téhož terénu; známé budovy jsou dávkované přes InstancedMesh. Půdorysy bez známé výšky se nevydávají za ověřené 3D budovy. Podlaží × 3 m je jen přibližná výška. Mimo demonstrátor jsou dostupné terén a tematické vrstvy, nikoli kompletní lokální kontext.
- **Porovnání:** ve 3D dva scissor průchody stejné kamery; v přehledu dvě synchronizované mapy s CSS výřezem. Levá strana je současný stav, pravá vybraný scénář. Při současném stavu jsou obě strany úmyslně totožné. Datové vrstvy se v obou stranách řídí stejnými přepínači.
- **Oddělení evidence:** `zones.geojson`, `existing.geojson`, `planned.geojson` a generovaný model mají oddělený původ. Model se nikdy nezapisuje do projektů. Stávající městské zdroje ani výstupní index se nepřepisují.

## Dostupná data a omezení

Podrobný registr zdrojů, odkazů, platnosti, stažení a licencí je v `data/sources.json` a přímo v aplikaci.

1. **MMR:** vydaná Změna č. 2 ÚRP účinná od 25. 8. 2026, oficiální GML EPSG:5514. Balíček obsahuje 61 oblastí, z nich 49 větrných (`DRUH_O_AKC=AOV`), které jsou importovány beze změn topologie a bez zjednodušení hranic. Transformace přes pyproj `always_xy=True`. Nejde o mapu vhodnosti MŽP. Návrhy a vymezení krajů/obcí nejsou importovány, neoznačují se proto za prázdné či neexistující v celé ČR.
2. **ŘLP:** 175 bodů typu Windmill z veřejné AIP ENR 5.4. Zachycuje trvalé letecké překážky, zejména od 100 m; není úplným seznamem turbín, potvrzením provozu ani průzkumem přesné paty stožáru. Souřadnice mají přesnost celých úhlových vteřin, přibližně 20–31 m. Datum načteného dokumentu je 16. 4. 2026 i při stažení přes cestu `valid` dne 13. 11. 2026; nelze mu připsat aktuálnější věcnou platnost.
3. **ČSVE:** pro Pchery náboj/stožár 100 m a rotor 88 m. Model je vysoký 144 m, avšak AIP u stejných překážek uvádí 138 m. Rozpor zůstává viditelný. Nejde o definitivně ověřený rozměrový demonstrátor; je nutná dokumentace provozovatele. Ostatní překážky mají neznámé rozměry a v detailu jen polohový bod, nikoli domyšlenou turbínu.
4. **Plánované projekty:** prázdný import. Nelze získat polohu z pouhého seznamu obcí, počtu turbín nebo polygonu oblasti. Před importem konkrétního projektu ověřit dokumentaci (EIA, projektant, obec), souřadnice a CRS, aktuální stav, hub/rotor/celkovou výšku a oprávnění k užití.
5. **Ilustrace:** pevná síť 800 m pouze uvnitř skutečných polygonů, vyloučeny vnitřní díry. Není modelem větrného potenciálu, optimalizací ani plánovanými stavbami. Rotor 150 m, náboj 175/200/225 m → maximum 250/275/300 m. Výchozí scénář je současný stav, ilustrace vypnutá.

Pohled z výšky očí je **orientační**. Terén objekty zakrývá, ale rozlišení DEM, chybějící přesné výšky budov, vegetace, datum měření, refrakce a zakřivení Země nedovolují odborný závěr o viditelnosti. Bod ŘLP není garantovanou přesnou polohou paty modelu. Izometrický pohled není důkazem skutečného výhledu.

## Spuštění

```sh
./setup.sh
npm run build:vitr
npm run nahled
# http://127.0.0.1:8000/vitr/
```

Sestavení kopíruje pouze `wind/` a potřebné lokální knihovny do `site/vitr/`; existující `site/index.html` a městské dlaždice zůstanou nedotčené. Lze zvolit jinou složku: `node scripts/build-wind.mjs cesta/k/vystupu`. Aplikaci je nutné podávat přes HTTP, ne `file://`. Živé podkladové mapy, další DEM a vyhledávání potřebují internet. Žádný API klíč se nevyžaduje. Není nasazeno na veřejný hosting.

## Ovládání

Vyhledání až po odeslání formuláře (Nominatim), detail kliknutím na bod nebo polygon, shluk kliknutím přiblíží. Tři stavy, samostatné vrstvy, místní ortografie a výška očí. V místní ortografii tažení otáčí, kolečko nebo gesto mění zoom, pravé tlačítko posouvá. Výška očí: tažení rozhlíží, šipky po 20 m posouvají pozorovatele uvnitř místní scény (na mobilu stejný pohyb směrovými tlačítky); svislá poloha se vždy odvodí jako terén + 1,7 m. Při změně místa se místní výřez znovu načte. Lokální posun mimo 6km výřez není celorepublikovým streamováním – pro další okolí se vraťte do přehledu.

Sdílení ukládá do fragmentu URL souřadnice středu, zoom, natočení, sklon, scénář, přepínače, výšku ilustrace, stav a poměr porovnání a místní kameru. Fragment lze otevřít na stejném hostingu. U ortografie se ukládá pozice, cíl i zoom kamery.

## Aktualizace

Automatické stahování nových právních vymezení není zapnuté. Aktualizace musí proběhnout jako kontrolovaná změna dat:

1. Na stránce MMR ověřit účinnost a zda jde o vydanou verzi. Stáhnout odkaz `downloadUrl` z registru, rozbalit GML do `work/` a spustit `.venv/bin/python scripts/import-wind.py work/Data_Z2_URP/URP_Z2.gml`. Importér předpokládá schválenou Z2; pro novou změnu upravit datum/stav až po ověření, ne jen vyměnit ZIP. `AOV` i budoucí `AOSV` jsou přípustné, `AOS` vyloučeno.
2. Stáhnout AIP, převést `pdftotext -layout work/aip.pdf work/aip.txt` (poppler-utils), spustit `.venv/bin/python scripts/import-aip.py work/aip.txt`. Ověřit datum uvnitř PDF a vzorek pozic proti zdroji. Import není potvrzením provozu. Párování Pcher je explicitní; u nové verze přezkoumat identifikátory 116 a 118 a rozpor výšek.
3. Kontext Pcher je odvozen z OSM API bbox uvedeného v registru. Reprodukovatelný importér je `scripts/import-wind-context.py`. DEM cache obnoví `scripts/cache-wind-dem.py`; mění se pouze veřejná data. Respektovat ODbL a limity zdrojových služeb.
4. Každé sadě změnit záznam v `sources.json`: skutečné datum platnosti, stažení, licence, známé nejistoty. Přezkoumat licenci AIP před hromadnou veřejnou redistribucí. Neoznačovat neuvedenou licenci za CC0.
5. `npm run test:vitr`, `npm run build:vitr`, `npm run test:vitr:browser` (prohlížečové testy vyžadují běžící náhled). Výstup pro hosting je samostatná statická složka.

## Rozsah první verze a další práce

Funguje tematický přehled, skutečné polygony AOV, neúplná evidence existujících překážek, místní demonstrátor, metrické turbíny se známými rozměry, orientační výška očí, porovnání, model a sdílení. Není hotový úplný ověřený registr provozu, import doložených záměrů, krajská/místní vymezení, přesný DMR 5G, úplné 3D budovy a porosty ani automatické streamování detailní místní zástavby pro celé Česko. V produkci je třeba také globálně omezit geokódování a zajistit smluvně kapacitu mapových služeb.

Kód prohlížeče zůstává AGPL-3.0-or-later. Data mají vlastní podmínky v registru. Autorství a kredity izomapy zůstávají zachovány.

## Provedená validace

- Sedm automatických datových a matematických kontrol: 49 větrných oblastí, uzavření prstenců a rozsah souřadnic, 175 jedinečných záznamů ŘLP, dvě konkrétní souřadnice Pcher proti DMS v AIP, výškový vztah, zachování děr modelové sítě, převod místních metrů a sdílený stav.
- Chromium/Playwright: načtený externí vektorový podklad, výchozí vypnutý model, dvě turbíny Pchery, skutečná bounding-box výška modelu 144 m, dvě dávky místního terénu/kontextu namísto 4187 samostatných objektů (stromy jsou další tři dávky instancí), kamera přesně 1,7 m nad stejným triangulovaným terénem, 13 modelů v místním výřezu AOV100, porovnání, obnovení kamery i ortografického zoomu po reloadu, šířka 390 px bez vodorovného přetékání a místní vyhledání Pcher.
- V ověřeném průchodu nebyly chyby JavaScriptu ani chyby externích požadavků. Cloud test používá pro externí požadavky Playwright API transport přes zděděnou proxy, s ověřováním certifikátů; nesnižuje bezpečnost produkční aplikace. Softwarové GPU je pomalé při velkých snímcích, proto nelze z této kontroly odvozovat garantované FPS na telefonu. Výkonnostní kontrola je strukturální: LOD map, omezené DPI, instance budov, síť 32768 terénních trojúhelníků, lazy načtení druhé mapy pouze při porovnání a 4,7MB statický build před HTTP kompresí.
- Neproběhlo geodetické měření poloh ani rozměrů, terénní ověření provozu, certifikace viditelnosti ani test na fyzickém telefonu. Souřadnice modelů zachovávají přesnost zdrojové AIP, nikoli lepší přesnost.

## Animované izomapy krajiny

Volba „Izomapa a měřítko krajiny“ nabízí skutečnou lokalitu a tři výslovně modelová diorámata: pole s remízky, les, pole s lesem a obcí. Modelová krajina má vlastní syntetický reliéf a nemá geografickou polohu. Nezapisuje objekty do ověřených vrstev. Všechny objekty používají stejné metry: turbína 250/275/300 m po špičku, stromy nastavitelné 10–35 m (výchozí 22 m), referenční dům po hřeben 8 m a člověk 1,7 m. Metrické pravítko zůstává u turbíny, výška náboje a průměr rotoru se nemění animací.

Rotor se otáčí kolem náboje. Pohyb 0–15 otáček za minutu (výchozí 8) je ilustrativní a nečerpá meteorologická data. Přepínač jej zastaví; systémová preference omezení pohybu se respektuje, uživatel může animaci výslovně zapnout. Před/po používá stejnou fázi rotoru a kameru. Číslo celkové výšky představuje maximum při průchodu lopatky svislou polohou, nikoli aktuální horní bod při každém natočení.

Skutečný demonstrátor Pchery doplňuje ze stejného stažení OSM pole `landuse=farmland` a ilustrační stromy pouze uvnitř skutečných lesních polygonů. Není známá výška ani rozmístění jednotlivých stromů; použité instance 22 m jsou modelové. Původní geografické vrstvy zůstávají zachované. Volba krajiny, výška stromů, rychlost a zapnutí animace se ukládají do sdíleného odkazu.
