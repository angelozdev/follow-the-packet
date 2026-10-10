import type { ComponentProps, ReactNode } from 'react';

export type ChoiceVariant = 'chip' | 'option';

export interface TrayChip {
  id: string;
  label: ReactNode;
}

type ChoiceProps = Omit<ComponentProps<'button'>, 'className' | 'style' | 'type' | 'aria-pressed'> & {
  variant?: ChoiceVariant;
  pressed?: boolean;
  children: ReactNode;
};

/** The one choice of the game: a chip (a short value, in a tray or a slot) or an option (a whole sentence, one per line). With pressed it is a toggle the screen reader hears as pressed or not; without it, a plain action drawn as a choice, such as a chip given back to its tray. */
export function Choice({ variant = 'chip', pressed, ...props }: ChoiceProps) {
  return <button type="button" className={variant} aria-pressed={pressed} {...props} />;
}

export type TrayVariant = 'default' | 'segmented';

const TRAY_CLASS: Record<TrayVariant, string> = {
  default: 'tray',
  segmented: 'tray tray--segmented',
};

interface ChipTrayProps {
  name: string;
  chips: TrayChip[];
  picked: string | null;
  onPick: (chipId: string) => void;
  variant?: TrayVariant;
}

/** A named tray of chips where at most one is picked: the name shows above the chips and names the group for screen readers, and picking a chip reports its id. The segmented variant, for a yes or no, draws its chips as the two halves of one pill. */
export function ChipTray({ name, chips, picked, onPick, variant = 'default' }: ChipTrayProps) {
  const choices = chips.map((chip) => (
    <Choice key={chip.id} pressed={picked === chip.id} onClick={() => onPick(chip.id)}>
      {chip.label}
    </Choice>
  ));
  return (
    <div role="group" aria-label={name} className={TRAY_CLASS[variant]}>
      <span className="tray__name caption caption--soft" aria-hidden="true">
        {name}
      </span>
      {variant === 'segmented' ? <div className="tray__segments">{choices}</div> : choices}
    </div>
  );
}
