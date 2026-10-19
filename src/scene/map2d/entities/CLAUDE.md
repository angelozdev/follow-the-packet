# scene/map2d/entities

What the 2D map draws in SVG, in the units of the layout (one unit is one pixel): the art that nobody operates, hidden from screen readers by the `aria-hidden` of the svg that holds it (`../map-stage.tsx`). It takes what the layout decided (`../layout/`) and draws it; it decides nothing. Task M10 adds the pieces here (`device`, `firewall`, `edge`, `internet`, `actor`, `network`), made from the icons of `src/scene/entities/`.

- `group-boxes.tsx`: `GroupBoxes`, the dashed box of every group of the layout (`.map-group`, with `data-group` and `data-kind`), the outline of a block included. The box has no name: a name is text and stands on the HTML layer (`../overlay/group-captions.tsx`). The `network` piece of Task M10 draws a group box too and reuses this one.
- `links.tsx`: `LinkLines`, a polyline for every link of the layout, whatever its kind (`.map-link`, with `data-kind`), the `line-end` stub included, and `MarkDots`, the dot at every place where a stamp can stand (`.map-mark`, with `data-station`), which shows whether or not the place has stamps.
- Colour and width come from the stylesheet (`src/styles.css`), by role tokens and the stroke scale, never from a value in the component. Two numbers are named in the component because the stylesheet cannot say them for an attribute: the radius of a group box and of a mark.
- A state is never shown by colour alone: a block is told from a group by its darker line, and a group by its dashes.
- Not here: the name of a group, the labels of the pieces, the stamps and the cards (`../overlay/`), where anything goes (`../layout/`), the packets (`../traffic/`).
- May import: `@/copy`, `@/design`, only types from `@/engine`, and other files of `src/scene/map2d/` (`@/scene/map2d/<folder>/<file>`).
