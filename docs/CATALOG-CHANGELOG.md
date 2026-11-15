# Katalog VTE a oddělené geometrické vrstvy

Změna 15. 11. 2026. Bez veřejného nasazení.

## Katalog a kvalita

Importér načítá přesně 89 lokalit/skupin z dodaného PSV. Každý řádek má stabilní ID podle názvu, původní sloupce raw, výrobce, model, variantu instalace, zdroj a datum. Různé výšky osy stejného modelu se neslučují. Výkon se převádí z kW na MW, celková výška je osa + průměr/2 a spodní úvrať osa − průměr/2.

V editoru vyberte vlastní turbínu, výrobce a model/instalační variantu. Výchozí jsou původní hodnoty ČSVE; pracovní oprava je zvláštní volba s výrazným upozorněním. Před aplikací je nutné potvrdit použití neověřených údajů pro simulaci. Ruční editace zůstává možná. Reference, varianta a příznak ruční změny se přenášejí přes JSON i URL; nikdy z nich nevzniká ověřený projekt. Měřítko živého glTF se odvozuje přímo z náboje a rotoru jako dosud.

Deset návrhů oprav (Andělka II., Dětřichov, Dívčí Hrad, Gruna–Žipotín III, Kopřivná, Jívová, Oldřišov, Vítězná a Zlatá Olešnice I/II) se neaplikuje automaticky. Václavice jsou blokovány jako smíšený typ; Mravenečník a Potštát jako konkrétní model neuveden. Zachovány všechny poznámky ze supplied overrides včetně Andělky I. a nesouladu V100 / 110 m v Moravici–Melči.

Výkonové nesoulady jsou čtyři: Gruna–Žipotín II, Hať III., Vítkov–Lysý Vrch a nově matematicky zachycené Václavice. Původní jednotkový i celkový výkon zůstávají beze změny. Reprodukovatelný audit npm run audit:catalog zapisuje .cache/catalog-audit.json se všemi 89 původními řádky, poznámkami, návrhy a nevyřešenými vazbami. Audit není součástí veřejného buildu.

## Propojení poloh

Žádné geokódování lokalit a žádné generování počtu bodů podle sloupce počet. Explicitní manifest vte_coordinate_matches.json páruje dva samostatné záznamy AIP 116 a 118 v Pcherech. Kontroluje současně ID, přesný očekávaný název i jednotlivé souřadnice z AIP; posun nebo nesoulad vazbu odmítne. Přesnost zdrojových souřadnic zůstává 20–31 m, nejde o geodetické zaměření paty.

Mapový soubor existing.geojson se nemění. Obohacení vzniká v paměti a původní souřadnice i všechny vlastnosti zůstanou zachované. Přidá se výrobce, model, výkon a důkaz párování. Pchery stále uvádějí rozpor 144 m z ČSVE proti 138 m v AIP. Zbývajících 88 katalogových lokalit nemá ověřenou vazbu; ostatním 173 bodům se rozměry nepřiřadí.

## Geometrie, odstupy a chybějící data

Všechny vrstvy jsou samostatně přepínatelné a přepínače se ukládají do URL. Místní 3D zobrazuje obrysy posazené na stejný terén jako modely. Před/po skrývá pomocnou geometrii vlastních simulací na levé straně.

| Vrstva | Výpočet a omezení |
| --- | --- |
| Obálka rotoru | Geodetický kruh D/2 pro možná natočení rotoru. Není okamžitým průmětem svislé rotorové plochy, záborem pozemku ani právním pásmem. Jen vlastní turbíny a existující body s doloženým či uvedeným průměrem; bez doplňování neznámých rozměrů. |
| Skutečný zábor | Pouze dodané ověřené Polygon/MultiPolygon construction_footprint s původem a datem. Žádný odhad poloměrem rotoru. |
| Pásmo výrobny | Vyžaduje skutečnou hranici fence / outer_wall / component_envelope, napětí, výkon a potvrzený aktuální právní základ. Výpočet od této hranice, nikoli od bodu stožáru. Podmíněná tabulka 20/7/1 m není automatickým potvrzením platnosti pro konkrétní zařízení. |
| 500 m | Turf polygonový buffer od klasifikovaných obytných ploch residential_area; není univerzální zákonná nezastavitelná zóna. Prosté půdorysy budov bez údaje o obytném využití nestačí. |
| Vedení / stanice | Vyžaduje skutečný krajní vodič, nikoli osu vedení, napětí nad 52 kV a doložený stav protikmitových opatření; u stanice skutečné oplocení. Odstup od listu 150/50 m, resp. 50 m od stanice. Viz níže omezení právní aktuálnosti. Zobrazení je konzervativní obálka přípustné polohy osy: odstup k listu + poloměr rotoru, nikoli libovolný zákaz kolem VTE. |
| Hluk / stroboskopický stín | Viditelné nedostupné volby; žádná vymyšlená izofona či stínicí kruh. Potřebují samostatný model a vstupy. |

data/spatial-constraints.geojson je prázdný: ověřené zábory, obytné plochy, hranice výroben a vodiče zatím nejsou k dispozici. Přepínače vysvětlují chybějící vstup, nikoli tvrzení, že omezení neexistuje. Testovací geometrie existují pouze v tests a neumisťují se do mapy.

**Právní kontrola:** oficiální [publikace novely 87/2025 na MMR](https://mmr.gov.cz/getmedia/9717938e-a361-4dc2-9266-76120627a9f9/Sb_2025_87_PZZ.pdf.aspx?ext=.pdf), strana 57, potvrzuje změnu vzdáleností od nejbližšího vodiče ke konci listu a od oplocení stanice. [Konsolidované znění 458/2000 v e-Sbírce](https://e-sbirka.gov.cz/sb/2000/458) nebylo v tomto prostředí čitelné. Aktuální účinnost nelze prohlásit za ověřenou; data/constraint-policy.json má currentLawVerified=false, takže se zákonná pásma ve skutečných mapách nevytvářejí. Historický test výpočtu není právní potvrzení. Podmínky nelze nahradit kruhem od středu stožáru.

## Licence a build

Zkontrolována [stránka instalací ČSVE](https://www.csve.cz/instalace/instalace-v-cr/) a domovská stránka: nebylo nalezeno výslovné oprávnění k hromadné redistribuci. To není tvrzení, že svolení nemůže existovat; nebylo doloženo a nikdo nebyl jménem uživatele kontaktován. data/catalog-policy.json zachovává redistributionApproved=false.

Lokální npm run dev používá pracovní referenční data. Výchozí npm run build čistí pouze ověřenou výstupní složku dist a kopíruje aplikaci bez data/reference; katalog v takové verzi transparentně ohlásí nedostupnost a původní editor dál funguje. Explicitní --with-catalog selže, dokud policy neobsahuje schválení, důkaz authorizationUrl a approvedAt. Žádný automatický deploy není přidán ani spuštěn. Zdrojové referenční soubory byly již před touto změnou součástí uživatelem určeného repozitáře.

Geometrické buffery používají lokální bundle Turf 7.2.0. Licence a verze jeho závislostí jsou v credits/GEOMETRY.md a credits/geometry. JSTS je distribuován pod EDL-1.0. Pro hlavní aplikaci není potřeba síťový import knihovny. npm ci je potřeba pro vývojové DOM testy (jsdom), nikoliv pro statický výstup.

## Kontroly

Původní devět testů terénu, metrického glTF, kamery, scénářů a dat zůstává součástí sady. Nové testy ověřují všech 89 původních řádků, všechny návrhy oprav a poznámky, čtyři výkonové nesoulady, blokované typy, nepřepisování dat, odmítnutí chybného párování, katalogové reference v URL, geometrii D/2, buffery od hranic, napěťové prahy, vodič vs. osu vedení a ochranu buildu před starými referenčními soubory. DOM test skutečně prochází výběr výrobce/modelu, potvrzení neověřených hodnot, aplikaci oprav i ruční editaci.

Vizuální WebGL kontrola v živém prohlížeči není těmito DOM a výpočetními testy nahrazena. Před veřejným provozem zůstává nutné vyřešit licenci, kvalitativně prověřit rozměry a doplnit skutečné vstupy odstupových vrstev.
