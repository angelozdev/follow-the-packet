# English only

Everything written into this repo is in English: identifiers, file and folder names, types, constants, test names (`describe`/`it`), JSDoc, commit messages, agent instruction files, rule files, the README and any other file outside `docs/`. Specs, plans and research stay in Spanish in this repo's `docs/`, and `docs/course/` holds verbatim Spanish copies of course files.

User-facing text is in Spanish, the product's language, and the project has no i18n layer. Spanish text lives only in named constants or message files, never inline in logic (see [[no-magic-strings]]):

- `src/copy/` holds the Spanish text maps, one file per area (UI, outcomes, reasons).
- Level files (`src/levels/NN-<chapter>/*.ts`) are content files and keep their own texts: brief, hints, option labels, takeaway.
- The engine never writes sentences. It returns a reason code with its data (for example `{ code: 'host-refused', deviceId: 'servidor2', port: 80 }`) and `src/copy/` turns it into Spanish.

Visible text never becomes an identifier: the identifier is English, and a Spanish term appears only in the displayed label.

**Why:** one language for code and docs keeps naming consistent, searchable and readable by anyone, and avoids mixed-language identifiers that read neither way.

**How to apply:** name things in English even when the requirement or the AWS term arrived in Spanish, and keep the Spanish wording only in a named constant or a level file.
