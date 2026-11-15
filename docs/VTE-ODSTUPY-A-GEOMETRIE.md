# Větrné elektrárny: geometrie, odstupy a jejich správná vizualizace

Pracovní metodika pro 3D energetickou mapu ČR, stav 2026-11-15. **Není to právní posudek.** Znění zákona ověřit ke dni použití.

## Geometrie každé turbíny
- Náboj / osa rotoru = `hubHeightM` nad terénem.
- Průměr rotoru = `rotorDiameterM`.
- Nejvyšší špička = `hubHeightM + rotorDiameterM/2`.
- Nejnižší bod lopatky = `hubHeightM - rotorDiameterM/2`.
- Půdorysný průmět rotoru o poloměru `rotorDiameterM/2` = **jen pomocná geometrie**. Není automaticky ochranné pásmo nebo zákaz staveb.
- Trvalý zábor stavby a manipulační plochy = **samostatná plocha projektu**, nikoliv kruh rotoru.

## Rozlišované typy omezení
| Vrstva | Údaj | Interpretace |
| --- | --- | --- |
| Ochranné pásmo výrobny (připojení nad 52 kV) | 20 m | Od skutečné hranice výrobny určené zákonem (např. vnější oplocení), ne automaticky od středu turbíny |
| Ochranné pásmo výrobny (>1 až 52 kV) | 7 m | Od zákonem určené hranice konkrétního zařízení |
| Ochranné pásmo výrobny (do 1 kV a výkon >50 kW) | 1 m | Podle oplocení / obalové křivky příslušných komponent; detaily zákona |
| Odstup od vedení nad 52 kV | 150 m bez protikmitových opatření; 50 m s nimi | Měří se od nejbližší polohy konce listu ke krajnímu vodiči – **nejde o odstup od domů** |
| Od oplocení elektrické stanice nad 52 kV | 50 m | Měří se od nejbližší polohy konce listu k oplocení |
| Orientační odstup pro vymezování akceleračních oblastí | 500 m od obytné zástavby sídel (vybraný metodický parametr) | **Není** univerzální zákonné nezastavitelné ochranné pásmo každé turbíny |
| Hluková, stínicí, bezpečnostní opatření | individuální | Nelze odvodit jeden zákonný kruh jen z typu turbíny |

Ochranné pásmo výrobny může omezovat stavby bez souhlasu vlastníka; výraz „nezastavitelné“ není obecně přesný.

## Podklady
- Zákon č. 458/2000 Sb., § 46, aktuální účinnost nezávisle kontrolovat: https://e-sbirka.gov.cz/sb/2000/458
- Novela č. 87/2025 Sb. (min. odstupy listů od vedení/stanic): https://e-sbirka.gov.cz/sb/2025/87
- Územní rozvojový plán, změna č. 2 a odůvodnění: https://www.mmr.gov.cz/cs/ministerstvo/stavebni-pravo/koncepce-a-strategie/uzemni-rozvojovy-plan/zmena-c-2-uzemniho-rozvojoveho-planu-a-souvisejici
- ČSVE, seznam modelů/lokalit: https://www.csve.cz/instalace/instalace-v-cr/

## Požadavky na UI a import
1. Oddělené vrstvy: (a) fyzická stopa a plocha rotoru, (b) zjištěné ochranné pásmo výrobny, (c) infrastruktura a zákonné vzdálenosti, (d) orientační 500m analytický buffer, (e) individuální posouzení hluku a stínu.
2. Neznáme-li hranici oplocení či napěťovou hladinu, **ochranné pásmo nesimulovat jako oficiální**. UI má zobrazit „Údaj chybí“ a případně umožnit uživatelsky zadaný, výrazně označený hypotetický buffer.
3. Právní stav zón a právní vzdálenosti aktualizovat a verzovat; nefiltrovat stavby pouze na základě bufferu 500 m.
4. Nedomýšlet chybějící souřadnice nebo model turbíny z názvu obce. 
