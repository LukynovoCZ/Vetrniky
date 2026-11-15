# Referenční katalog instalací větrných elektráren v ČR

Založeno 2026-11-15 pro projekt Vítr v krajině.

## Soubory
- `vte_csve_instalace_2025-12-01.psv`: 89 lokalit nebo skupin instalací, **původní převzaté hodnoty bez tichého přepisování**. Oddělovač `|`, první řádek je hlavička, UTF-8.
- `vte_3d_quality_overrides.json`: pracovní návrhy oprav pro 3D modelování a detekované rozpory. Jde o **hypotézy / kontrolní poznámky**, nikoliv automaticky ověřená skutečnost.

Původní zdroj: [ČSVE – Instalace v ČR](https://www.csve.cz/instalace/instalace-v-cr/) (tabulka platná k 1. 12. 2025). Pracovní soupis vyšel z předchozího rešeršního XLSX (89 řádků; přehledy modelů, právních odstupů a zdrojů).

## DŮLEŽITÉ: licence a zveřejnění
Na webu ČSVE **nebyla ověřena licence výslovně dovolující hromadné další šíření tabulky**. Před začleněním souboru do veřejného produkčního webu ověř oprávnění k přebírání/redistribuci soupisu (včetně případného databázového práva); podle výsledku buď požádej o souhlas, nebo nahraď import vlastním katalogem sestaveným z nezávisle ověřených primárních dat. Nespouštěj automatizované stahování ani nevytvářej kopii cizí mapové služby.

## Význam sloupců
- `rotor_csve_m`: průměr rotoru dle zdroje, **může obsahovat chyby/prohození**.
- `osa_csve_m`: výška náboje/stožáru dle zdroje, **může obsahovat chyby/prohození**.
- `jednotkovy_vykon_kw`, `pocet_vte`, `vykon_lokality_kw`: nekonzistence mezi součinem a celkem označit, nikoliv automaticky opravit.
- `rok_instalace`: text, může obsahovat více let nebo interval.
- `lokalita`: lokalita/skupina, **není jedinečné ID fyzické turbíny ani potvrzená souřadnice**.

Doporučené odvozené hodnoty:
- špička nad terénem = výška osy + průměr rotoru / 2;
- spodní úvrať = výška osy − průměr rotoru / 2;
- nepoužívat čísla, pokud je v záznamu `do_not_model_as_single_type` nebo parametr nebyl ověřen.

**Nezaměňovat** fyzický rotorový kruh, trvalý zábor půdy, ochranné pásmo podle energetického zákona, odstupové analytické pásmo 500 m při tvorbě AO ani případné hlukové/stínicí limity. Žádná jednotná zákonná kruhová „nezastavitelná zóna“ pro každou VTE neexistuje.

## Použití v aplikaci
Import provádět do **odděleného katalogu typů a technických parametrů**. Neumisťovat 89 řádků do mapy jako jednotlivé body, protože pro ně chybí ověřené souřadnice jednotlivých stožárů. Pozice z existujícího AIP datasetu párovat pouze se spolehlivou kontrolou názvu i polohy a se záznamem nejistoty. V UI označit nezávisle ověřené a orientační rozměry.

Toto je **vývojový datový podklad**, nikoliv právní posudek ani oficiální autorizovaný registr provozovaných elektráren.
