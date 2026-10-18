# scene/map2d/marks

What stands on the 2D map once the layout is done, as pure functions: no React, no DOM, no clock, no randomness. The layout (`../layout/`) says where each mark is and gives the boxes of the labels and the icons; this folder decides which stamps are drawn at each mark, where the label of a packet stands, how two shapes on one point are told apart and which boxes overlap. The design is in the spec (`docs/specs/2026-10-12-follow-the-packet-2d-map-design.md`, «Los sellos», «Los paquetes y su etiqueta», «Colisiones»).

- `stamp-fan.ts`: `fanStamps(stamps, marks)`. `stamps` holds the stamps of each place by the name of its station (`StampSource`: an id, whether it is a problem, and its `send` number, which a live flow of the incident does not have); `marks` is `layout.marks`. It returns a `Fan` for every place that has stamps, in the order of the marks, and throws when a place with stamps has no mark.
- `packet-tags.ts`: `stillTags` (the labels a still map draws), `placeTags` (where each one stands) and `separateGlyphs` (the shapes of two packets on one point).
- `collisions.ts`: `collisions(layout, fans, tags)`, the pairs of boxes that overlap.
- `boxes.ts`: `crowds` and `holds`, the two box tests of the other three, with a noise of 1e-6 px so a float that lands a hair over an edge is not a collision.

## The fan

- A fan opens across the link (along the `axis` of its mark), centered on the mark, with its casillas 25 px apart (`FAN_PITCH`) and a stamp 36 px wide (`STAMP`). When the stamps are no more than the casillas of the mark (at most 3), every stamp is drawn and the fan has as many casillas as stamps, so a lone stamp stands on the mark and is never moved, hidden or counted. The stamps keep the order they were given in, from the low end of the axis (`y` going down, `x` going right) to the high one.
- When they are more, the fan uses all the casillas of the mark: `casillas - 1` stamps and, in the last one, the «+N» that counts the rest, `N = stamps - (casillas - 1)`, never less than 2. A mark of one casilla draws a lone «+N» that counts every stamp. The list of the «+N» (`more.ids`) holds every stamp of the place, the drawn ones too, in the order they were given; `hidden` holds the ones that went into it.
- Who goes into the «+N»: the stamps with no problem before the ones with a problem, and among equals the oldest first. The age is the `send` number, the last send of that combination (the game keeps one stamp per combination, with the number of its last send); a live flow has no `send` and is older than everything the player sent, and among live flows the first one given is the oldest. So a problem stamp stays in sight while any other can go in, and with more problem stamps than casillas the oldest problem stamps go in.
- A place never loses a stamp in silence: a station with stamps and no mark throws.

## The labels of packets

- A label (`PacketTag`) has the path of its packet and the size of its box. It stands on the middle of its path. If a box is in the way it slides along the path (no farther than it takes: the nearest place where it clears, forward on a tie), and if no place of the path is clear it goes up 22 px (`TAG_STEP`) and tries the whole path again, then down 22, up 44, down 44 and up 66: three steps up and two down at most. Up is toward smaller `y`. The places it tries are the middle and the ones where an edge of its box touches an edge of an obstacle (the nearest clear place is always one of them), so it is found exactly and no step in pixels is chosen.
- The obstacles are the boxes the caller lists (the drawn stamps and the «+N», the labels of the pieces, the icons, whatever else it counts) and the labels already placed, in the order given. A label that nothing touches does not move. A label that no height clears stays in the middle of its path and says it is not `clear`; `collisions` then lists it.
- The label of a packet whose stamp went into a «+N» is not drawn on the still map (O-8): `stillTags` leaves it out and its text is the line of the list. Call `stillTags` first and then `placeTags`.
- `separateGlyphs`: a shape that falls on the point of one placed before it (1e-6 px) moves 12 px (`GLYPH_STEP`) further along its own path, and again until it stands alone; near the end of the path it moves back instead.

## Collisions

- `collisions` lists, in the order label of a piece, icon, stamp and label of a packet, every pair that overlaps. Boxes that only touch do not. Two stamps of one fan overlap by design and are not listed while both lie inside the box of their fan (an overlap of the same stamps that strays from the fan is). A «+N» is a stamp.
- The layout has no box for the name of a group (Task M11 decides where it stands), so the names are not among the things it checks yet.

## Known limits

The fans of two marks overlap in the places M4 exempts (`layout/arrange/CLAUDE.md`, «Known limits»; `row.test.ts` names them and nothing else). Measured on 2026-10-18 with a full fan on every mark (one stamp more than the casillas) of 738 maps: the 25 registered incidents at the start (with and without every term known), solved and in each case, in the row, the compact row and the snake at 360, 390, 768, 900, 1060, 1280 and 1440 px. `collisions` reports exactly these and nothing else; `collisions.test.ts` fixes it on the start worlds of the registered incidents and two more offices, drawn whole, in the row, the compact row and the snake at 390 and 900 px:

| Place | Marks | Apart | Stamps it takes | Where |
|---|---|---|---|---|
| `bus-end` against `road` | `road:<last device of the bus>` (3 casillas) and `bus-end:<bus>` (1) | 40 px | 2 on the road and 1 at the end | the 738 maps |
| `mid:bus:*` of buses that share a trunk | `mid:bus:<a>-<stop>` and `mid:bus:<b>-<stop>` (VPC of chapter 4) | 0 px: they coincide | 1 and 1 | 04-01 and 04-02 in the row (12 maps) |
| | `road:<device>` and `mid:bus:*` | 11, 28 or 42 px | 1 and 1 | 51 maps of 01-06, 01-07, 01-08, 02-04, 02-06 and 02-07, in the three modes |
| | `bus-end:<bus>` and `mid:bus:*` | 26 px | 1 and 1 | 02-04 and 02-06 in the row (12 maps) |
| | `router:<branch>` and `mid:bus:*`, and the stamp of the `mid:bus` over the icon of the branch router | 27 px, and 19 px to the icon | 1 and 1 | 02-07 in the row (6 maps) |
| marks on the bus of the lanes | `mid:internet-door:<server>` and `mid:door:<server>-line-end` | 13 or 22 px | 1 and 1 | 50 maps of 01-08, 01-09, 01-10, 01-14, 02-07 and 02-08, in the row |
| | `door:<server>` and `mid:door:<server>-line-end` | 33 or 36 px | 1 and 1 | 200 maps of the same incidents, in the compact row and the snake |
| | `door:<lane>` and `mid:<stop>-line-end` | 32 or 52 px | 1 and 1 at 32 px, 2 and 1 at 52 px | 63 maps of 02-09, 04-01 and 04-02, in the compact row and the snake |

The flows that every incident runs by itself, placed as stamps on the 450 maps of the start states, collide nowhere and none needs a «+N». Whether the sends of the player do is for the sweep of Task M8.

Marks of one casilla (measured on 450 maps: the 25 incidents at the start and solved, in the row, the compact row and the snake at seven widths): `bus-end` holds one in 594 of 594, `mid:bus:*` in 158 of 594, `mid:<stop>-line-end` in 156 of 324, `line-end` in 2 of 450 and other `mid` marks in 2 of 378. A stamp that ends there belongs to a packet that died (nobody has the IP, or a router the map does not draw dropped it), so it is a problem stamp, and any two of them make a lone «+2» that hides problem stamps. The sentinel of Task M8 reads this; M6 adds no exception.

Not here: where a mark stands and how many casillas it holds (`../layout/arrange/`), drawing (React and SVG), the text of a stamp or of a list (`src/copy/`, `src/game/`). May import: `@/copy`, only types from `@/engine`, and other files of `src/scene/map2d/`. Its tests also read `@/engine`, `@/levels` and `@/testing`.
