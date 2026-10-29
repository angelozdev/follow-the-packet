import { Close, Content, Overlay, Root, Title } from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Button } from '@/design/primitives/button';
import { Card } from './card';

interface DialogProps {
  name: string;
  closeText: ReactNode;
  closeLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal: boolean;
  onCloseAutoFocus?: () => void;
  children: ReactNode;
}

const keepOpen = (event: Event) => event.preventDefault();

export function Dialog({ name, closeText, closeLabel, open, onOpenChange, modal, onCloseAutoFocus, children }: DialogProps) {
  return (
    <Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <Overlay className="dialog__overlay" />
      <Content className="dialog" aria-describedby={undefined} onInteractOutside={modal ? undefined : keepOpen} onCloseAutoFocus={onCloseAutoFocus}>
        <Card
          header={{
            title: <Title>{name}</Title>,
            meta: (
              <Close asChild>
                <Button variant="small" aria-label={closeLabel}>
                  {closeText}
                </Button>
              </Close>
            ),
          }}
        >
          {children}
        </Card>
      </Content>
    </Root>
  );
}
