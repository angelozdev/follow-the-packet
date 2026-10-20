# ui/catalog/__screenshots__/entities.browser.test.tsx

The two references of `src/ui/catalog/entities.browser.test.tsx`, named `<name>-<browser>-<platform>.png`; they exist for the platform they were recorded on, `darwin` in Chromium:

- `entities-chromium-darwin.png`, 1232×2050: the region «Piezas del mapa», with the animations off.
- `interface-chromium-darwin.png`, 1232×2828: the region «Elementos de la interfaz», with the animations off and the focus ring on the option «Una respuesta posible».

The comparison tolerates no different pixel and no colour threshold (`allowedMismatchedPixelRatio`, `allowedMismatchedPixels` and `threshold` at 0), except the edges pixelmatch counts as anti-aliasing. The guide of the parent folder says how to re-record one; another platform needs its own references, recorded on purpose.

- Not here: anything but the references of this test file.
- May import: nothing (it holds no code).
