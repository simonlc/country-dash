import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export const AboutDialog = NiceModal.create(() => {
  const modal = useModal();

  return (
    <Dialog
      actions={(
        <Button variant="contained" onClick={() => void modal.hide()}>
          {m.action_close()}
        </Button>
      )}
      open={modal.visible}
      size="md"
      title={(
        <div className="grid gap-1">
          <p className="m-0 text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {m.about_overline()}
          </p>
          <h2 className="m-0 text-xl font-semibold">{m.app_name()}</h2>
        </div>
      )}
      onClose={() => void modal.hide()}
    >
      <div className="grid gap-4">
        <div className="surface-display-accent rounded-sm p-4">
          <p className="m-0">{m.about_description_1()}</p>
        </div>
        <p className="m-0">{m.about_description_2()}</p>
        <p className="m-0">{m.about_description_3()}</p>
      </div>
    </Dialog>
  );
});
