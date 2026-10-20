# ui/catalog/__screenshots__

The reference captures of `entities.browser.test.tsx`. Vitest (`toMatchScreenshot`) writes them, one folder for each test file, and nothing else edits them. The folder is named by Vitest, not by the kebab-case rule, and it holds only captures and the guides.

- A capture changes only on purpose: when a task changes how an entity or an interface element looks, it deletes the reference that changes and runs the test (`pnpm exec vitest run --project browser src/ui/catalog/entities.browser.test.tsx`), which writes the missing reference and fails that test once for it, runs it again, and commits the new image with the change after looking at it next to the old one. Never `vitest -u` or `--update`, which would record whatever the page draws, right or wrong.
- A failing comparison writes its actual image and its diff to `.vitest/attachments`, which git ignores, never here.
- Not here: failure images, captures of anything but the catalog page (a new capture gets the `__screenshots__` of its own test).
- May import: nothing (it holds no code).
