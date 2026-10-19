# scene/map2d/overlay

What the 2D map puts on its HTML layer (`.html-layer`, the layer above the svg): the text and the controls the player reads and presses, at the pixels the layout gives. Everything here is plain DOM that a screen reader reads; the art under it is the svg (`../entities/`). Tasks M11 to M15 add the labels of the pieces, the stamps and the card anchor.

- `group-captions.tsx`: `GroupCaptions`, the name of every group that has something to say, as a `span.caption` at the box `captionBoxes` (`../layout/captions.ts`) keeps for it, so the guarantee of the sweep of Task M8 holds for what is drawn. A name is the parts of `Group.name` whose term the player knows (`shownParts`), joined by a space: the block `192.168.1.0/24` only once `cidr` is known. The words «Oficina» and «VPC» and how the parts join are Task M11's (`MAP_TEXT.groups` in `src/copy/`); until then a group that is only a block of IPs, such as the office, says no more than its block. The name of the outline of a block (`blockName`, `Group.name` empty) has no box yet: Task M11 gives it one.
- The layer keeps the classes the helpers of e2e and the inspection box read: `.caption` (not `.caption--soft`, which `MAP_MARKS` leaves out), and, as the tasks add them, `.map-button`, `button.stamp` and `.map-card`.
- Not here: the svg (`../entities/`), where anything goes (`../layout/`), the Spanish text (`src/copy/`).
- May import: `@/copy`, and other files of `src/scene/map2d/` (`@/scene/map2d/<folder>/<file>`).
