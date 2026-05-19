# Valoris — Werkinstructie

## Inloggen

Ga naar de applicatie-URL → vul je **e-mailadres** en **wachtwoord** in → klik **Inloggen**.

Bij twijfel over je wachtwoord: vraag de beheerder om het te resetten via Beheer → Gebruikers.

---

## Navigatie

De **linkerzijbalk** toont de domeinen waar je toegang toe hebt (bijv. *Inkomen*, *Burgerzaken*). Klik op een domein om de drie tabbladen te zien: **Inrichting · Veranderingen · Strategie**. Beheerders zien onderaan ook ⚙ **Beheer**.

---

## Rollen — wat kan wie?

| | Lezer | Redacteur | Beheerder |
|---|:---:|:---:|:---:|
| Strategie bekijken | ✓ | ✓ | ✓ |
| Metingen invoeren | — | ✓ | ✓ |
| Veranderingen beheren | — | ✓ | ✓ |
| Domeinen / indicatoren inrichten | — | — | ✓ |
| Zaaksoorten aanmaken / herordenen | — | — | ✓ |
| Gebruikers beheren | — | — | ✓ |

---

## Inrichting *(beheerder)*

De Inrichting-pagina is het startpunt voordat je kunt meten.

### Klantreis (zaaksoorten)

- De strip bovenaan toont de zaaksoorten als klantreis (links → rechts).
- **Nieuwe zaaksoort:** klik **+ Zaaksoort** rechtsboven in de strip → vul naam, icoon en behandelkanaal in → Opslaan.
- **Zaaksoort bewerken:** hover over een chip → klik **✎**.
- **Volgorde aanpassen:** pak de **⠿** handle en sleep de chip naar de gewenste positie. De volgorde wordt direct opgeslagen.

### Indicatoren koppelen aan een zaaksoort

Klik op een zaaksoort. Je ziet drie staten per indicator:

| Staat | Uiterlijk | Betekenis |
|---|---|---|
| **Beschikbaar** | Grijs, gestippeld kader | Indicator is aan het domein gekoppeld, maar nog niet relevant gemaakt voor deze zaaksoort. Klik om toe te voegen. |
| **Relevant** | Blauwe rand, blauwe stip | Norm is ingesteld, maar nog geen meting voor deze periode. |
| **Gemeten** | Stoplicht 🟢🟠🔴 | Meting aanwezig. Kleur = waarde vs norm (≥ norm groen, 80–99% oranje, < 80% rood). |

**Indicator toevoegen:** klik op een grijze (beschikbare) indicator óf gebruik **+ indicator toevoegen** onderaan.
Stel **normwaarde**, **richting** (hoger/lager is beter) en **gewicht** in → Toevoegen.

**Norm/gewicht aanpassen:** klik **✎** naast een actieve indicator.

**Indicator deactiveren:** klik **×** naast een actieve indicator.

### Metingen invoeren

1. Navigeer naar de juiste **periode** (Maand / Kwartaal / Jaar + pijltjes ‹ ›). De huidige kalenderperiode heeft een blauw **nu**-badge.
2. Klik **+ meting toevoegen** bij een relevante indicator → typ de waarde → kies de **bron** (Handmatig / Systeem / Import / Berekend) → druk **Enter** of klik ergens anders.
3. Een ingevoerde meting toont de waarde + stoplichtkleur.
4. **Valideren:** klik de groene **✓** knop naast een meting om hem te valideren. Gevalideerde metingen tonen een groen *gevalideerd* label.
5. **Bewerken:** klik **bewerken** naast de waarde.

> **Trendpijl (↑↓):** vergelijkt met de vorige periode. Groen = richting norm, rood = van norm af.

---

## Veranderingen beheren *(redacteur + beheerder)*

Veranderingen zijn geplande of lopende ingrepen die de strategiematrix moeten verschuiven.

### Verandering aanmaken

1. Ga naar het tabblad **Veranderingen**.
2. Klik **+ Nieuw** → vul naam, type, status en data in.
   - **Type:** Structureel / Procesmatig / Technisch / Overig
   - **Status:** Concept / Actief / Afgerond / Geannuleerd

### CSV-import

1. Maak een CSV-bestand met minimaal de kolom `Naam` (optioneel: `Omschrijving`, `Type`, `Status`).
2. Klik **Import** → selecteer het bestand → controleer de samenvatting.

### Impact registreren

1. Selecteer een verandering in de linkerlijst.
2. Klik op een **zaaksoort** in de klantreis-strip.
3. Je ziet alleen de indicatoren die voor die zaaksoort een norm hebben, plus de **huidige meetwaarde** erbij.
4. Klik **+ impact** naast een indicator → typ de verwachte verandering (positief of negatief) → Enter.

> Indicatoren zonder norm (niet ingesteld via Inrichting) zijn grijs en klikbaar zodra je ze toevoegt via Inrichting → zaaksoort → indicator toevoegen.

---

## Strategie bekijken *(alle rollen)*

1. Ga naar het tabblad **Strategie**.
2. Bovenaan staan de **zaaksoorten** (klantreis). Selecteer er maximaal 3 tegelijk via de chips.
3. De **matrix** toont elke zaaksoort als een punt:
   - **Volle cirkel (●)** = IST (laatste meting)
   - **Open cirkel (○)** = SOLL (norm)
   - **Pijl (→)** = verwachte verandering na geplande ingreep
   - **Y-as** = prestatie (doorlooptijd, tevredenheid …)
   - **X-as** = inrichting (automatisering, standaardisatie …)
4. Rechts zie je per geselecteerde zaaksoort: **IST · SOLL · GAP** (verschil).
5. Verander de **periode** rechtsboven om historische data te zien.

---

## Inrichten *(beheerder) — volgorde bij nieuw domein*

1. **Beheer → Domeinen** — domein aanmaken
2. **Beheer → Zaaksoorten** — zaaksoorten toevoegen én volgorde instellen met ↑↓
   *(kan ook direct op de Inrichting-pagina via slepen)*
3. **Beheer → Indicatoren** — indicatoren aanmaken in de bibliotheek
4. **Beheer → Ind. koppelen** — indicatoren aanzetten voor het domein
5. **Beheer → Periodes** — meetperiodes aanmaken (maand / kwartaal / jaar)
6. **Inrichting-pagina** — norm + gewicht koppelen aan elke zaaksoort (klik grijze indicator)

---

## Gebruikers beheren *(beheerder)*

Ga naar **Beheer → Gebruikers**:

- **Nieuw account:** klik *+ Nieuwe gebruiker* → vul naam, e-mail en wachtwoord in.
- **Rol toewijzen:** klik *Rol toewijzen* bij een gebruiker → kies domein + rol → Opslaan.
  Na opslaan zijn de rechten direct actief (geen herstart nodig).
- **Wachtwoord resetten:** klik *Wachtwoord* → typ nieuw wachtwoord → Opslaan.

---

## Veelgestelde vragen

**De matrix is leeg / toont geen punten**
Nog geen metingen ingevoerd. Ga naar Inrichting, voeg indicatoren toe aan zaaksoorten en voer metingen in voor de huidige periode.

**Ik zie geen domeinen in de zijbalk**
Je account heeft nog geen domeinrol. Vraag de beheerder om een rol toe te wijzen.

**"Sessie verlopen" / automatisch uitgelogd**
Sessies verlopen na 7 dagen. Log opnieuw in.

**Indicator ontbreekt in de lijst bij Inrichting**
De indicator staat nog niet in de bibliotheek, of is niet aan het domein gekoppeld.
Ga naar Beheer → Indicatoren → aanmaken, daarna Beheer → Ind. koppelen → aanzetten voor het domein.

**Impact registreren lukt niet (indicator is grijs)**
De indicator heeft nog geen norm voor die zaaksoort. Ga naar Inrichting → kies de zaaksoort → klik de grijze indicator om een norm in te stellen.

**Zaaksoort staat in de verkeerde volgorde**
Sleep de chip op de Inrichting-pagina naar de juiste positie, of gebruik ↑↓ in Beheer → Zaaksoorten.

---

*Valoris — versie 2*
