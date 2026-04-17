import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export const HowToPlayDialog = NiceModal.create(() => {
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
            {m.how_to_play_overline()}
          </p>
          <h2 className="m-0 text-xl font-semibold">{m.app_name()}</h2>
        </div>
      )}
      onClose={() => void modal.hide()}
    >
      <div className="grid gap-5">
        <div className="surface-display-accent rounded-sm p-4">
          <p className="m-0">{m.how_to_play_intro()}</p>
        </div>

        <section className="grid gap-2">
          <h3 className="m-0 text-base font-semibold">{m.how_to_play_what_title()}</h3>
          <p className="m-0 text-sm">{m.how_to_play_what_body()}</p>
        </section>

        <section className="grid gap-2">
          <h3 className="m-0 text-base font-semibold">{m.how_to_play_how_title()}</h3>
          <p className="m-0 text-sm">{m.how_to_play_how_body_1()}</p>
          <p className="m-0 text-sm">{m.how_to_play_how_body_2()}</p>
        </section>

        <section className="grid gap-2">
          <h3 className="m-0 text-base font-semibold">{m.how_to_play_modes_title()}</h3>
          <p className="m-0 text-sm">{m.how_to_play_modes_body()}</p>
        </section>
      </div>
    </Dialog>
  );
});
