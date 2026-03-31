import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

export const AboutDialog = NiceModal.create(() => {
  const modal = useModal();

  return (
    <Dialog fullWidth maxWidth="sm" open={modal.visible} onClose={() => void modal.hide()}>
      <DialogTitle>About Country Guesser</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography>
            Country Guesser is a globe-based geography game built as a static app
            with React 19, TanStack Router, MUI, NiceModal, and a typed game
            logic layer.
          </Typography>
          <Typography>
            Start a round, identify the highlighted country, and work through the
            weighted difficulty pool without interrupting the current session.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => void modal.hide()}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});
