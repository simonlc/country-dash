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
    <Dialog
      fullWidth
      maxWidth="sm"
      open={modal.visible}
      onClose={() => void modal.hide()}
    >
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
              borderRadius: 3,
              p: 2,
            }}
          >
            <Typography variant="body1">
              A globe-first geography game for fast country recognition.
            </Typography>
          </Box>
          <Typography>
            Daily challenge for one fixed route, plus custom runs across
            regions, island nations, microstates, and broader world pools.
          </Typography>
          <Typography>
            Built with React, TanStack Router, MUI, and a typed game logic
            layer.
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
