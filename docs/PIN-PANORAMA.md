# Výhled ze špendlíku – Benátky nad Jizerou

## Použití

1. V horní části panelu zvolte **Zapíchnout špendlík do mapy** a klikněte do přehledu. Mapový bod se označí červeně a otevře se panorama z výšky očí 1,7 m nad DEM.
2. Nebo zvolte **Vzor: Benátky – u zámku**. Tato ukázka výslovně zapne modelový scénář: pravidelné ilustrační rozmístění 250m turbín uvnitř skutečných oblastí. Nejsou to plánované pozice staveb.
3. Rozhlížejte se tažením; tlačítka otáčejí o 45°. Kolečko nebo původní posuvník zorného pole mění FOV 35–90°. Po kliknutí na výsledek se kamera natočí k němu. Modely se nezvětšují podle vzdálenosti ani minimální pixelové velikosti.
4. Dosah lze nastavit na 20, 40 nebo 60 km. Výsledky platí pouze v tomto dosahu a pro zapnuté vrstvy/scénář. Žádné výsledky v dosahu neznamenají, že v celé ČR nejsou elektrárny. Nejvýše se zpracuje 2000 nejbližších kandidátů, případné omezení je viditelně označené.
5. **Vybrat jiný špendlík** vrátí mapu na stejné okolí. Nový bod znovu přepočítá terénní výhled. Sdílení ukládá stanoviště, dosah, scénář, azimut, sklon kamery a zorné pole do fragmentu URL. Lokální ISO, katalog, editor, před/po a původní pozorovatelský režim zůstávají dostupné; číselné stanoviště v editoru nově otevírá panorama.

Přímý místní příklad: http://127.0.0.1:8000/#view=panorama&observer=14.822584,50.290909&lng=14.822584&lat=50.290909&s=model&range=40&h=250

## Vzorový bod a skutečné ověření

Ukázka je orientační bod v okolí zámku podle [zveřejněných souřadnic památky](https://www.mistopisy.cz/pruvodce/body-zajmu/593/zamek-benatky-nad-jizerou/): 14.822584 E, 50.290909 N. Není to přesně zaměřená vyhlídka ani potvrzení možnosti přístupu. Budovy včetně samotného zámku nejsou započítány.

Reprodukovatelné ověření npm run verify:benatky stáhne pouze potřebné otevřené Terrarium PNG do .cache/panorama-dem a zapisuje .cache/benatky-visibility.json. Ověření 15. 11. 2026 nad aktuálními projektovými daty: 14 DEM dlaždic, dosah 40 km, výška terénu bodu přibližně 234,86 m ve zdrojovém DEM, nejbližší hranice Chorušice AOV83 přibližně 9,18 km. V modelovém scénáři 250 m je 29 kandidátů; jejich horní body v této metodě leží nad terénním horizontem. Jde výhradně o modelové objekty a teoretický výpočet, nikoli potvrzení skutečné viditelnosti člověkem.

Srovnávací nižší bod 14.824512 E, 50.289161 N (přibližný městský referenční bod, DEM asi 198,61 m) vrací všech 29 horních bodů za terénem. Rozdíl není odstraněn ani překreslen na žádoucí výsledek. Dokládá význam správného stanoviště a také potřebu podrobnějšího DEM a terénního ověření v blízkosti svahů. Přesné počty se mohou změnit s daty, výškou modelů nebo polohou špendlíku.

## Výpočet a význam výsledků

- Sférický model Země R = 6371008,8 m. Z geografických souřadnic a zdrojových výšek se tvoří místní ENU souřadnice. Zakřivení Země je zahrnuto shodně v terénu, objektech i testu spojnice. Nejde o geodetický elipsoidový model a neprovádí se transformace DEM na Bpv/WGS84 výškové datum.
- Pro každého kandidáta se porovná úhel k horní špičce s nejvyšším vzorkovaným úhlem terénu na jeho směru. Blízké profily mají krok 20 m, dále 50/100 m a ve vzdálené části 250 m. To není zárukou zachycení každé úzké překážky.
- Rozdíl větší než +5 m v rovině cíle vede k označení **horní bod nad terénním horizontem**, rozdíl menší než −5 m k označení **horní bod zakrytý terénem**, mezilehlý případ **u horizontu – nejisté**. Pětimetrové rozmezí je pracovní tolerance, nikoliv statisticky doložená přesnost DEM. Zakrytí horního bodu ve směru osy není odborný výpočet zákrytu všech možných poloh listů do stran.
- Známe-li pouze výšku překážky AIP, testuje se jen její horní bod; nekonstruuje se náboj a rotor. V panoramatu může být zobrazená šedá svislá značka překážky namísto vymyšleného modelu turbíny. Ostatní neznámé výšky jsou označené jako chybějící.
- Živé glTF modely používají skutečné metry, jsou nakloněné podle sférické svislice a posazené na DEM. Terén je schematická radiální síť, není fotografickým obrazem okolí. Výpočet profilu je jemnější než vzdálená úhlová triangulace terénu; vykreslení nemá přesnost odborného viewshedu.
- Ovlivnění budovami, vegetací, atmosférou, viditelností za počasí, refrakcí, zrakovou rozlišitelností a přesným vertikálním datem není započítané. Blízký svah i rozdíl v DEM mohou změnit výsledek. Mapa výslovně uvádí **teoretický terénní výhled**.

## Data a výkon

Výškové podklady a kredity zůstávají Tilezen/Mapzen Terrarium (EU-DEM / globální zdroje, viz data/sources.json a credits/TERRAIN-ATTRIBUTION.md). Území celé ČR se nestahuje. Z12 je použito do 2 km, z11 do 6 km, z10 do 20 km, z9 dále do zvoleného dosahu; přibližná velikost pixelu v ČR 25–200 m. Stahují se malé ohraničující dlaždicové výřezy, nejvýše čtyři požadavky souběžně. RAM cache drží nejvýše 96 dekódovaných dlaždic. Změna pouhého FOV nepřipravuje znovu terén. Nový bod či scénář ruší předchozí výpočet; chyba DEM nebo NoData nevede k falešné rovné krajině.

Síť terénu je vytvářena podle skutečných výšek, pozorovatel má v místním systému y=1,7 m a jeho terén y=0. Odborná fotovizualizace nebo viewshed zde nevzniká. Neproběhlo veřejné nasazení; ochrana katalogových dat z předchozí změny zůstává zachovaná.

## Testy

Nové testy pokrývají kulovou geometrii a zakřivení, vzdálenosti/azimuty, blokující hřeben, neznámé rozměry, chybějící DEM, více úrovní dlaždic a jejich souběžnost, NoData, nalezení nejbližší hranice oblasti, špendlíkové ovládání, obnovení kamery z URL, skutečnou geometrii radiálního terénu a 3D výpočetní průchod bez GPU. Původní regresní testy katalogu, editoru, terénu a sdílení zůstávají zachované.

Živý WebGL průchod a fyzický telefon nejsou těmito testy nahrazeny. Výsledek nástroje verify:benatky ověřuje numerickou větev na reálných datech, nikoli finální obraz či odbornou přesnost viditelnosti.

## Výseč směru kamery

Přehledová mapa ukazuje modrou průhlednou výseč ze špendlíku, její okraj a přerušovanou osu pohledu. V panoramatu se stejná mapa zmenší do severně orientované mapky. Tlačítko Zvětšit mapu ji vrátí do hlavního přehledu; směr zůstane zakreslený. Otáčení aktualizuje výseč během tažení. Šířka vychází ze skutečného poměru stran perspektivní kamery a jejího FOV; zoom a změna velikosti okna proto odpovídajícím způsobem mění výseč. Zohlední se také půdorysná projekce nakloněné kamery; při zahrnutí svislého směru může tvořit celé okolí. Délka výseče odpovídá zkoumanému dosahu 20/40/60 km.

Výseč je orientační záběr kamery, nikoli plocha skutečné viditelnosti. Nemaskuje oblasti skryté za terénem, budovami nebo vegetací a nenahrazuje výsledky terénního profilu. Polohy ani modelové scénáře nemění.

## Rozhlednová orientace: kterým směrem a na co

Přímo v panoramatu je kompasová stupnice s českými světovými stranami (S, SV, V, JV, J, JZ, Z, SZ), dílky po 5° a číselnými azimuty. Středová značka odpovídá směru kamery. Při rozhlížení, změně FOV nebo rozměrů okna se mění poloha dílků i popisků.

Popisky nad obrazem a jejich spojnice používají tutéž perspektivu, stanoviště 1,7 m a sférické souřadnice jako 3D modely. Uvádějí název oblasti, elektrárny nebo uživatelského objektu, vzdálenost a jasně odlišují ILUSTRACI V OBLASTI, MOJI SIMULACI a EVIDENCI ŘLP. Více modelových turbín stejné oblasti tvoří jeden popisek; počet platí jen pro objekty právě v záběru. Kliknutí na popisek či název natočí kameru k reprezentativnímu objektu. Horní řádek vybírá skupinu nejbližší středu obrazu; nejde o dodatečně ověřenou dominantu nebo obecní centrum.

Zakryté a neznámé objekty se nevydávají za viditelné popisky v obraze. Při porovnání před/po se nezobrazují popisky budoucích objektů na levé, současné straně. Popisky za kamerou mizí, blízké popisky se rozkládají do nepřekrývajících se řádků. Na krátkém displeji zůstává kompas a rolovatelný seznam názvů bez plovoucích spojnic.

První verze pojmenovává objekty ze stávajících dat VTE a oblastí. Kopce, města a jiné krajinné dominanty nejsou domýšlené ani automaticky přiřazené podle názvu oblasti. Terénní a datová omezení výhledu zůstávají stejná.
