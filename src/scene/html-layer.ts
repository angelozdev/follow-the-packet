/** The CSS selector of what the map floats over itself and the player reads: the label of a piece, the stamp of a packet and the name of a group. The cards and the tags of the packets are not in it. */
export const MAP_MARKS = '.map-button, button.stamp, .html-layer .caption:not(.caption--soft)';

/** The CSS selector of a card that opens on the map: the holder of the terminal, a firewall's task card, the card with tabs of a piece. The map draws it on its HTML layer, and the inspection box reads where it stands to keep clear of it. */
export const MAP_CARD = '.map-card';
