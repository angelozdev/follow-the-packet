import { Button } from '@/design';
import type { TermText } from '@/copy';
import { TaggedText } from '@/ui/tagged-text';

export interface System {
  id: string;
  label: TermText;
  onPress: () => void;
  expanded?: boolean;
  domId?: string;
  controls?: string;
}

interface SystemsBarProps {
  systems: System[];
}

export function SystemsBar({ systems }: SystemsBarProps) {
  return (
    <div className="incident__systems">
      {systems.map(({ id, label, onPress, expanded, domId, controls }) => (
        <Button key={id} variant="small" id={domId} aria-expanded={expanded} aria-controls={controls} onClick={onPress}>
          <TaggedText text={label} tips={false} />
        </Button>
      ))}
    </div>
  );
}
