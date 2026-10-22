# Mitwirken

Schön, dass du bei der Website von „Stopp Air Base Ramstein“ mithelfen möchtest! Dieses Dokument richtet sich an alle Ehrenamtlichen — ganz gleich, ob du schon mit Astro/Tailwind gearbeitet hast oder zum ersten Mal hier bist. Es gibt für praktisch jede Art von Mitarbeit einen passenden, einfachen Einstieg, auch ganz ohne Programmierkenntnisse.

## Welcher Weg passt zu mir?

- Du möchtest **eine Nachricht, Analyse oder einen Termin veröffentlichen** (z. B. eine Ankündigung zur nächsten Aktion)? → Redaktionsoberfläche nutzen, siehe „Beiträge/Termine pflegen" unten. Kein Git, kein Code, keine technischen Vorkenntnisse nötig.
- Du möchtest **einen bestehenden Text ändern**, der nicht über die Redaktionsoberfläche läuft (z. B. eine Argumentseite unter „Warum Ramstein" oder eine Mitmachen-Seite)? → „Andere Inhalte ändern" unten. Braucht einen GitHub-Account, aber keine Programmierkenntnisse.
- Du möchtest **am Code der Website arbeiten** (Layout, Design, neue Funktionen)? → „Code ändern" unten. Setzt Grundkenntnisse in Astro/Tailwind bzw. TypeScript voraus.

Im Zweifel: einfach fragen, wir helfen gerne beim Einordnen.

## Setup

```bash
git clone https://github.com/Acephali92/SAR2.0.git
cd SAR2.0
npm install
npm run dev
```

Dev-Server läuft unter `http://localhost:4321`. Voraussetzung: Node.js ≥ 22.

## Bevor du beiträgst

Lies zuerst:
- [`CLAUDE.md`](./CLAUDE.md) — verbindliche Kurzregeln (Stack, Verbote, Content Security Policy)
- [`guidelines.md`](./guidelines.md) — ausführliche Projektregeln
- [`docs/INHALTE-PFLEGEN.md`](./docs/INHALTE-PFLEGEN.md) — falls du nur Inhalte (Texte, Artikel, Termine) bearbeitest, nicht Code

## Drei Arten von Beiträgen

### Beiträge/Termine pflegen (kein Git, kein Code)

Nachrichten, Analysen und Termine werden über die Redaktionsoberfläche (Payload CMS) unter `redaktion.stoppramstein.de` gepflegt — kein GitHub-Account, keine Pull Requests nötig. Siehe [`docs/INHALTE-PFLEGEN.md`](./docs/INHALTE-PFLEGEN.md), Teil B, für Login, Rich-Text-Editor und den Entwurf→Freigabe→Veröffentlichung-Ablauf.

### Andere Inhalte ändern (Git, aber kein Code)

Warum-Ramstein-Argumente, Mitmachen-Seiten und rechtliche Seiten bleiben Markdown-Dateien im Repo. Bearbeite die passende `.md`-Datei unter `src/content/<collection>/`. Siehe [`docs/INHALTE-PFLEGEN.md`](./docs/INHALTE-PFLEGEN.md), Teil A, für die Pflichtfelder pro Collection. Wichtig:
- Alle Fakten brauchen eine Quelle (`sources`-Feld) — keine Zahlen oder Aussagen erfinden.
- Unbelegte Aussagen in [`docs/REDAKTION-TODO.md`](./docs/REDAKTION-TODO.md) eintragen statt löschen oder frei erfinden.
- `stoppramstein_content/` ist nur Referenzmaterial (migrierte alte Seite) — dort nichts ändern.

### Code ändern

- Kein React/Vue/Preact, keine UI-Libraries (shadcn, radix, …), kein Tracking, keine externen CDNs, keine Cookies (siehe `CLAUDE.md`) — gilt für die öffentliche Astro-Seite. Das CMS in `cms/` ist ein eigenständiges, intern gehostetes Next.js/React-Projekt mit eigenen Regeln (siehe `docs/ARCHITEKTUR.md`).
- Farben/Abstände/Schriften über die bestehenden Tailwind-Tokens (`tailwind.config.mjs` → `src/styles/global.css`) verwenden, keine neuen willkürlichen Hex-Werte in Klassen wie `bg-[#...]`.
- Inline-`<script>`-Tags vermeiden (Production-CSP ist `script-src 'self'`).

**Am CMS (`cms/`) arbeiten:** eigenes, von der Astro-Seite unabhängiges npm-Projekt.

```bash
cd cms
cp .env.example .env    # lokale Werte eintragen
npm install
docker compose up -d postgres   # nur die Datenbank lokal starten
npm run dev              # Payload-Admin unter http://localhost:3000/admin
```

Der Astro-Dev-Server (`npm run dev` im Root) braucht ein erreichbares Payload, um Beiträge/Termine live zu laden — ohne laufendes `cms/` fällt er automatisch auf eine committete Fixture zurück (`src/content/_fixtures/`), reicht für reine Frontend-Arbeit.

## Branch- und Commit-Konventionen

- Feature-Branches: `feat/<kurzname>`, `fix/<kurzname>`, `chore/<kurzname>`
- Commit-Messages im [Conventional-Commits](https://www.conventionalcommits.org/)-Format:

```
feat: add ArticleLayout with sidebar ToC
fix: correct font loading order
docs: update README with architecture section
chore: update dependencies
```

## Vor jedem Commit

```bash
npm run verify
```

Muss fehlerfrei durchlaufen (Typecheck + Build + Link-Check + CSP-Check, siehe [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) für Details zum CSP-Check).

## Pull Requests

- Kurze, klare Beschreibung: was wurde geändert und warum.
- Bei Content-PRs: Quellen für neue Fakten verlinken.
- `master` ist per Ruleset geschützt: Änderungen nur per Pull Request, kein Force-Push, kein Löschen. Das gilt auch für Admins.
- Gemergt werden kann erst, wenn die automatischen Prüfungen (siehe unten) grün sind. Nach dem Merge löscht GitHub den Branch automatisch.

## Automatische Prüfungen

Bei jedem Push und Pull Request laufen:

- **Verify** (`.github/workflows/ci.yml`): `npm run verify` für die öffentliche Seite.
- **CMS** (`.github/workflows/ci.yml`): `npm ci`, `tsc --noEmit` und `next build` in `cms/`. Eine Datenbank wird dafür nicht gebraucht.
- **Semgrep** (`.github/workflows/security.yml`): Sicherheitsscan ohne Semgrep-Konto. Ein Pull Request scheitert nur, wenn er neue Findings bringt. Alle Ergebnisse erscheinen im Repo unter *Security → Code scanning*.

Das Ruleset verlangt diese Checks unter ihrem exakten Job-Namen (`name:` im Workflow): „Verify (typecheck, build, link/CSP checks)“, „CMS (install, typecheck, build)“ und „Semgrep“. Wer einen Job umbenennt, muss das Ruleset unter *Settings → Rules → Rulesets → master-schutz* anpassen, sonst wartet jeder PR auf einen Check, der nie kommt. Im Notfall lässt sich das Ruleset dort vorübergehend auf „Disabled“ stellen.

Dependabot (`.github/dependabot.yml`) schlägt Updates als Pull Requests vor:
- **Versions-Updates:** wöchentlich und gebündelt, frühestens 7 Tage nach einem Release. Major-Updates kommen als eigene PRs und brauchen meist eine Migration.
- **Sicherheitsupdates:** kommen sofort, für `cms/` ausschließlich diese.
- **Payload:** `payload` und alle `@payloadcms/*` müssen dieselbe Version haben. Wird der CMS-Check bei einem Dependabot-PR rot, die übrigen `@payloadcms/*` von Hand nachziehen.

Offene technische Punkte stehen in [`docs/OFFENE-PUNKTE.md`](./docs/OFFENE-PUNKTE.md), erledigte im [Änderungsprotokoll](./docs/AENDERUNGSPROTOKOLL.md).
