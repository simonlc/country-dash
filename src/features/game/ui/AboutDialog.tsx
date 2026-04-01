import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useAppearance } from '@/app/appearance';
import { getThemeAccentSurfaceStyles } from '@/app/theme';

export const AboutDialog = NiceModal.create(() => {
  const modal = useModal();
  const { activeTheme } = useAppearance();
  const accentSurface = getThemeAccentSurfaceStyles(activeTheme);

  return (
    <Dialog fullWidth maxWidth="sm" open={modal.visible} onClose={() => void modal.hide()}>
      <DialogTitle>
        <Stack spacing={0.75}>
          <Typography color="text.secondary" variant="overline">
            About
          </Typography>
          <Typography variant="h4">Country Guesser</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Box
            sx={{
              ...accentSurface,
              borderRadius: 4,
              p: 2,
            }}
          >
            <Typography variant="body1">
              A globe-first geography challenge built around fast recognition,
              clean rounds, and themed presentation.
            </Typography>
          </Box>
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
