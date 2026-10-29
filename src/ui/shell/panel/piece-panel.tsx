import { Fragment, useId, type ReactNode, type RefObject } from 'react';
import { PIECE_TEXT, TASK_CARD_TEXT, toPlainText } from '@/copy';
import { Button, Card, Tabs } from '@/design';
import type { Inspection, Panel, PanelPart, PanelTab } from '@/game';
import { EntityIcon } from '@/scene';
import { InspectionFields } from '@/ui/incident/inspection-box';
import type { CardFrame } from '@/ui/incident/map-cards/card-frame';
import { TaggedText } from '@/ui/tagged-text';
import type { PanelChoice } from './use-panel-choice';

interface PiecePanelProps {
  panel: Panel;
  inspection: Inspection;
  heading: RefObject<HTMLHeadingElement | null>;
  choice: PanelChoice;
  frameOf: (part: PanelPart) => CardFrame;
  onClose?: () => void;
}

interface TabContent {
  body: ReactNode;
  shown: CardFrame[];
}

function PartName({ part }: { part: PanelPart }) {
  return (
    <h3 className="caption caption--soft">
      <TaggedText text={part.label} />
    </h3>
  );
}

function contentOf(tab: PanelTab, { panel, inspection, choice, frameOf }: Omit<PiecePanelProps, 'heading' | 'onClose'>): TabContent {
  if (tab.id === 'status') return { body: <InspectionFields fields={inspection.fields} />, shown: [] };
  const frames = tab.parts.map(frameOf);
  if (tab.holds === 'sections') {
    return {
      body: tab.parts.map((part, index) => (
        <div key={part.id}>
          <PartName part={part} />
          {frames[index].body}
        </div>
      )),
      shown: frames,
    };
  }
  if (tab.holds === 'one') return { body: frames[0].body, shown: [frames[0]] };
  const chosen = choice.fichaOf(panel.pieceId, tab);
  const at = tab.parts.findIndex((part) => part.id === chosen);
  if (tab.parts.length === 1) {
    return {
      body: (
        <>
          {tab.parts[0].id !== 'rules' && <PartName part={tab.parts[0]} />}
          {frames[0].body}
        </>
      ),
      shown: [frames[0]],
    };
  }
  return {
    body: (
      <Tabs
        name={toPlainText(tab.label)}
        variant="underline"
        selected={chosen}
        onSelect={(partId) => choice.chooseFicha(panel.pieceId, tab.id, partId)}
        tabs={tab.parts.map((part, index) => ({ id: part.id, label: <TaggedText text={part.label} />, panel: frames[index].body }))}
      />
    ),
    shown: [frames[at]],
  };
}

/** Takes the panel of a piece, its inspection, the ref of the heading that names it, the choice of tab and ficha of the shell, what frames a part and, when the caller offers it, what the X does, and returns the panel: a card named by its heading (the icon and the name of the piece on its stripe, and at the right of the stripe the X that frees the choice when there is something to do on it) with the tabs the piece has in the fixed order, one of them chosen, and under them, when the chosen part has them, the actions of its foot and its «Listo». «Estado» shows the fields of the inspection; «Ajustes» shows its parts one under the other, each under its name; a tab of fichas shows them as tabs of their own when it has several and, when it has one, under its name (the rules of a firewall have no name of their own); the terminal and the browser fill their tab. A server of the internet says its roles once, above the tabs. Radix mounts only the tab chosen, so the drafts live above it, with the caller. */
export function PiecePanel({ panel, inspection, heading, choice, frameOf, onClose }: PiecePanelProps) {
  const titleId = useId();
  const selected = choice.tabOf(panel);
  const contents = panel.tabs.map((tab) => ({ tab, content: contentOf(tab, { panel, inspection, choice, frameOf }) }));
  const shown = contents.find(({ tab }) => tab.id === selected)?.content.shown ?? [];
  const hasFoot = shown.some(({ actions, onDone }) => actions !== undefined || onDone !== undefined);
  return (
    <Card
      aria-labelledby={titleId}
      header={{
        title: (
          <h2 id={titleId} ref={heading} tabIndex={-1}>
            {inspection.entity && <EntityIcon entity={inspection.entity} />}
            <TaggedText text={inspection.title} tips={false} />
          </h2>
        ),
        meta: onClose && (
          <Button variant="small" aria-label={PIECE_TEXT.closeLabel} onClick={onClose}>
            {PIECE_TEXT.close}
          </Button>
        ),
      }}
    >
      <div className="chip-card">
        <div className="chip-card__body">
          {panel.roles && (
            <p className="chip-card__roles muted">
              <TaggedText text={panel.roles} />
            </p>
          )}
          <Tabs
            name={PIECE_TEXT.tabsName}
            selected={selected}
            onSelect={(tabId) => {
              const tab = panel.tabs.find(({ id }) => id === tabId);
              if (tab) choice.chooseTab(panel.pieceId, tab.id);
            }}
            tabs={contents.map(({ tab, content }) => ({ id: tab.id, label: <TaggedText text={tab.label} />, panel: content.body }))}
          />
        </div>
        {hasFoot && (
          <div className="chip-card__actions">
            {shown.map(({ actions, onDone }, index) => (
              <Fragment key={index}>
                {actions}
                {onDone && <Button onClick={onDone}>{TASK_CARD_TEXT.done}</Button>}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
