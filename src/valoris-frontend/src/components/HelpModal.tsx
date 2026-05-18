import { Modal } from './Modal';
import './HelpModal.css';

interface Props { onClose: () => void; }

export function HelpModal({ onClose }: Props) {
  return (
    <Modal title="Werkinstructie Valoris" onClose={onClose} wide>
      <div className="help-body">

        <section>
          <h2>Inloggen</h2>
          <p>Ga naar de applicatie-URL → vul je <strong>e-mailadres</strong> en <strong>wachtwoord</strong> in → klik <strong>Inloggen</strong>. Bij twijfel: vraag de beheerder om het wachtwoord te resetten via Beheer → Gebruikers.</p>
        </section>

        <section>
          <h2>Rollen — wat kan wie?</h2>
          <table>
            <thead><tr><th></th><th>Lezer</th><th>Redacteur</th><th>Beheerder</th></tr></thead>
            <tbody>
              <tr><td>Strategie bekijken</td><td>✓</td><td>✓</td><td>✓</td></tr>
              <tr><td>Metingen invoeren</td><td>—</td><td>✓</td><td>✓</td></tr>
              <tr><td>Veranderingen beheren</td><td>—</td><td>✓</td><td>✓</td></tr>
              <tr><td>Inrichting / zaaksoorten</td><td>—</td><td>—</td><td>✓</td></tr>
              <tr><td>Gebruikers beheren</td><td>—</td><td>—</td><td>✓</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Inrichting <span className="help-rol">beheerder</span></h2>

          <h3>Klantreis (zaaksoorten)</h3>
          <ul>
            <li><strong>Nieuwe zaaksoort:</strong> klik <strong>+ Zaaksoort</strong> rechtsboven in de strip.</li>
            <li><strong>Bewerken:</strong> hover over een chip → klik <strong>✎</strong>.</li>
            <li><strong>Volgorde:</strong> pak de <strong>⠿</strong> handle en sleep naar de gewenste positie.</li>
          </ul>

          <h3>Drie staten per indicator</h3>
          <table>
            <thead><tr><th>Staat</th><th>Uiterlijk</th><th>Betekenis</th></tr></thead>
            <tbody>
              <tr><td><strong>Beschikbaar</strong></td><td>Grijs, gestippeld</td><td>Indicator is domein-gekoppeld, maar nog niet relevant voor deze zaaksoort. Klik om toe te voegen.</td></tr>
              <tr><td><strong>Relevant</strong></td><td>Blauwe rand + stip</td><td>Norm ingesteld, nog geen meting.</td></tr>
              <tr><td><strong>Gemeten</strong></td><td>Stoplicht 🟢🟠🔴</td><td>Meting aanwezig. ≥ norm groen · 80–99% oranje · &lt; 80% rood.</td></tr>
            </tbody>
          </table>

          <h3>Metingen invoeren</h3>
          <ol>
            <li>Navigeer naar de juiste <strong>periode</strong> (pijltjes ‹ ›). De huidige periode heeft een blauw <strong>nu</strong>-badge.</li>
            <li>Klik <strong>+ meting toevoegen</strong> → typ de waarde → kies de <strong>bron</strong> (Handmatig / Systeem / Import / Berekend) → druk <strong>Enter</strong>.</li>
            <li><strong>Valideren:</strong> klik de groene <strong>✓</strong> knop naast een meting om hem te bevestigen.</li>
            <li><strong>Norm/gewicht aanpassen:</strong> klik <strong>✎</strong> naast een actieve indicator.</li>
          </ol>
        </section>

        <section>
          <h2>Veranderingen <span className="help-rol help-rol-red">redacteur + beheerder</span></h2>
          <ol>
            <li>Ga naar het tabblad <strong>Veranderingen</strong> → klik <strong>+ Nieuw</strong>.</li>
            <li>Vul naam, type, status en data in. Of importeer via <strong>CSV</strong> (verplichte kolom: <em>Naam</em>).</li>
            <li>Selecteer een verandering → klik een <strong>zaaksoort</strong> → klik <strong>+ impact</strong> naast een indicator om een verwachte verandering te registreren.</li>
          </ol>
          <p className="help-tip">💡 Je ziet alleen indicatoren die een norm hebben voor die zaaksoort, plus de huidige meetwaarde (IST) erbij.</p>
        </section>

        <section>
          <h2>Strategie <span className="help-rol help-rol-green">alle rollen</span></h2>
          <ul>
            <li>Selecteer zaaksoorten via de chips bovenaan.</li>
            <li>De matrix toont <strong>●</strong> IST · <strong>○</strong> SOLL · <strong>→</strong> verwachte verandering.</li>
            <li><strong>Y-as</strong> = prestatie · <strong>X-as</strong> = inrichting.</li>
            <li>Verander de periode rechtsboven voor historische data.</li>
          </ul>
        </section>

        <section>
          <h2>Volgorde bij nieuw domein <span className="help-rol">beheerder</span></h2>
          <ol>
            <li>Beheer → Domeinen — domein aanmaken</li>
            <li>Beheer → Zaaksoorten — zaaksoorten toevoegen + volgorde (of via Inrichting slepen)</li>
            <li>Beheer → Indicatoren — indicatoren aanmaken in de bibliotheek</li>
            <li>Beheer → Ind. koppelen — indicatoren aanzetten voor het domein</li>
            <li>Beheer → Periodes — meetperiodes aanmaken</li>
            <li>Inrichting — norm + gewicht koppelen per zaaksoort</li>
          </ol>
        </section>

        <section>
          <h2>Veelgestelde vragen</h2>
          <dl>
            <dt>De matrix is leeg / toont geen punten</dt>
            <dd>Nog geen metingen ingevoerd. Ga naar Inrichting en voer metingen in voor de huidige periode.</dd>

            <dt>Ik zie geen domeinen in de zijbalk</dt>
            <dd>Je account heeft nog geen domeinrol. Vraag de beheerder om een rol toe te wijzen.</dd>

            <dt>"Sessie verlopen" / automatisch uitgelogd</dt>
            <dd>Sessies verlopen na 7 dagen. Log opnieuw in.</dd>

            <dt>Indicator ontbreekt bij Inrichting</dt>
            <dd>Ga naar Beheer → Indicatoren → aanmaken, daarna Beheer → Ind. koppelen → aanzetten voor het domein.</dd>

            <dt>Impact registreren lukt niet (indicator is grijs)</dt>
            <dd>De indicator heeft nog geen norm voor die zaaksoort. Ga naar Inrichting → kies de zaaksoort → klik de grijze indicator om een norm in te stellen.</dd>

            <dt>Zaaksoort staat in de verkeerde volgorde</dt>
            <dd>Sleep de chip op de Inrichting-pagina naar de juiste positie, of gebruik ↑↓ in Beheer → Zaaksoorten.</dd>
          </dl>
        </section>

      </div>
    </Modal>
  );
}
