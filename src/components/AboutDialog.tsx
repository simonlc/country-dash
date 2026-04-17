import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const AboutDialog = NiceModal.create(() => {
  const modal = useModal();

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void modal.hide();
        }
      }}
    >
      <DialogContent className="sm:max-w-[640px]" showCloseButton={false}>
        <DialogHeader>
          <div className="grid gap-1">
            <p className="m-0 text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">
              {m.about_overline()}
            </p>
            <DialogTitle className="text-xl">{m.app_name()}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid gap-4">
          <Card className="p-4" tone="accent">
            <p className="m-0">{m.about_description_1()}</p>
          </Card>
          <p className="m-0">{m.about_description_2()}</p>
          <p className="m-0">{m.about_description_3()}</p>
        </div>
        <DialogFooter className="-mb-0 -mx-0 border-none bg-transparent p-0">
          <Button variant="contained" onClick={() => void modal.hide()}>
            {m.action_close()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
