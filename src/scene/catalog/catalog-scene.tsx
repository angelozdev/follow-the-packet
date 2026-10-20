import { CATALOG_COLUMNS, CATALOG_ROWS, STAGE } from './catalog-cells';

const ROW_STYLE = { gridTemplateColumns: `repeat(${CATALOG_COLUMNS}, ${STAGE.width}px)` };

const captionId = (cellId: string) => `catalog-caption-${cellId}`;

/** Takes whether animations are off; returns the whole entity catalog as a grid of specimens, one row for each entity or variant: every specimen is a figure that holds its drawing (hidden from screen readers and from the keyboard, since it is only to look at) and its caption, which names the figure. With animations on, the pieces that move shake or pulse. */
export function CatalogScene({ still }: { still: boolean }) {
  return (
    <div className="catalog__canvas catalog2d">
      {CATALOG_ROWS.map((row) => (
        <div key={row[0].id} className="catalog2d__row" style={ROW_STYLE}>
          {row.map(({ id, caption, art, html }) => (
            <figure key={id} className="catalog2d__specimen" data-specimen={id} aria-labelledby={captionId(id)}>
              <div className="catalog2d__stage" style={STAGE} aria-hidden="true" inert>
                {art && (
                  <svg width={STAGE.width} height={STAGE.height} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}>
                    {art(still)}
                  </svg>
                )}
                {html}
              </div>
              <figcaption id={captionId(id)} className="catalog__caption catalog2d__caption">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
