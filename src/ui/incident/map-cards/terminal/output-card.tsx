import { MESSAGE_TEXT, TERMINAL_TEXT, type TermText } from '@/copy';
import { Button, Message } from '@/design';
import type { OutputSegment, ToolOutput, TracerouteView } from '@/game';
import { TaggedText } from '@/ui/tagged-text';

/** What the output card prints: the hops of a traceroute, or the lines an `nc` or a `dig` printed. */
export type Printed = { kind: 'route'; route: TracerouteView } | { kind: 'tool'; tool: ToolOutput };

interface OutputCardProps {
  printed: Printed;
  unfolded: boolean;
  onToggle: () => void;
}

function Notes({ notes }: { notes: TermText[] }) {
  return notes.map((note) => (
    <p key={note} className="muted">
      <TaggedText text={note} />
    </p>
  ));
}

/** What a traceroute printed: its hops as a numbered list, with the IP that answered (or a star) and the time of each, and the notes that say what the stars, the marks and the times mean. */
function RouteOutput({ route }: { route: TracerouteView }) {
  return (
    <>
      {route.error && (
        <Message variant="warning" words={MESSAGE_TEXT}>
          <TaggedText text={route.error} />
        </Message>
      )}
      {route.lines.length > 0 && (
        <ol className="rules" aria-label={TERMINAL_TEXT.route.label}>
          {route.lines.map((line) => {
            const aside = TERMINAL_TEXT.route.aside(line.time, line.mark);
            return (
              <li key={line.hop}>
                <span className="rules__text">
                  <code>{TERMINAL_TEXT.route.hop(line.hop, line.address)}</code>
                </span>
                {aside && (
                  <span className="muted">
                    <code>{aside}</code>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <Notes notes={route.notes} />
    </>
  );
}

function ToolLine({ text, keep }: { text: string; keep: boolean }) {
  return <code className={keep ? 'output__line output__line--key' : 'output__line'}>{text}</code>;
}

function Segment({ segment, unfolded }: { segment: OutputSegment; unfolded: boolean }) {
  if (segment.kind === 'line') return <ToolLine text={segment.text} keep={segment.key} />;
  if (unfolded) return segment.lines.map((text, index) => <ToolLine key={index} text={text} keep={false} />);
  return <span className="output__fold">{TERMINAL_TEXT.output.folded(segment.lines.length)}</span>;
}

/** What an `nc` or a `dig` printed, line by line as the tool printed it, tabs included. A folded output keeps the key lines in view and puts a mark where the others are, saying how many lines are there; the control, which only an output with folded lines has, unfolds them in place and folds them again. */
function ToolOutputLines({ tool, unfolded, onToggle }: { tool: ToolOutput; unfolded: boolean; onToggle: () => void }) {
  return (
    <>
      <div className="output" role="group" aria-label={TERMINAL_TEXT.output.label[tool.command]}>
        {tool.segments.map((segment, index) => (
          <Segment key={index} segment={segment} unfolded={unfolded} />
        ))}
      </div>
      {tool.folded > 0 && (
        <Button variant="small" aria-expanded={unfolded} onClick={onToggle}>
          {unfolded ? TERMINAL_TEXT.output.hide(tool.folded) : TERMINAL_TEXT.output.show(tool.folded)}
        </Button>
      )}
      <Notes notes={tool.notes} />
    </>
  );
}

/** The «Salida» of the terminal: what the last tool sent printed. The state of the fold is the caller's, so it survives whatever the caller does with the card around it. */
export function OutputCard({ printed, unfolded, onToggle }: OutputCardProps) {
  return printed.kind === 'route' ? <RouteOutput route={printed.route} /> : <ToolOutputLines tool={printed.tool} unfolded={unfolded} onToggle={onToggle} />;
}
