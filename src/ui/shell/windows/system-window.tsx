import type { ReactNode } from 'react';
import { WINDOW_TEXT } from '@/copy';
import { Dialog } from '@/design';

interface SystemWindowProps {
  name: string;
  open: boolean;
  onClose: () => void;
  buttonId: string;
  children: ReactNode;
}

const giveTheFocusBack = (buttonId: string) => {
  if (document.activeElement === document.body) document.getElementById(buttonId)?.focus();
};

export function SystemWindow({ name, open, onClose, buttonId, children }: SystemWindowProps) {
  return (
    <Dialog name={name} closeText={WINDOW_TEXT.close} closeLabel={WINDOW_TEXT.closeLabel} open={open} onOpenChange={onClose} modal={false} onCloseAutoFocus={() => giveTheFocusBack(buttonId)}>
      {children}
    </Dialog>
  );
}
