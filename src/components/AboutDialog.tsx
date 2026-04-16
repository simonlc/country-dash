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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAppearance } from '@/app/appearance';
import { designTokens } from '@/app/designSystem';
import { getThemeDisplaySurfaceStyles } from '@/app/theme';

export const AboutDialog = NiceModal.create(() => {
  const modal = useModal();
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeTheme } = useAppearance();
  const displayAccentSurface = getThemeDisplaySurfaceStyles(
    activeTheme,
    'accent',
  );

  return (
    <Dialog
      fullScreen={isCompactLayout}
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
          <Typography variant="h4">Country Dash</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Box
            sx={{
              ...displayAccentSurface,
              borderRadius: designTokens.radius.md,
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
            Built with React, MUI, and a typed game logic layer.
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
