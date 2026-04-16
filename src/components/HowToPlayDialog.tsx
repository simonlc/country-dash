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

export const HowToPlayDialog = NiceModal.create(() => {
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
            How To Play
          </Typography>
          <Typography variant="h4">Country Dash</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.25}>
          <Box
            sx={{
              ...displayAccentSurface,
              borderRadius: designTokens.radius.md,
              p: 2,
            }}
          >
            <Typography variant="body1">
              Identify the highlighted country on the globe as quickly and
              accurately as you can.
            </Typography>
          </Box>

          <Stack spacing={1}>
            <Typography variant="h6">What the game is</Typography>
            <Typography variant="body2">
              Country Dash is a globe-based geography game. Each round
              highlights one location, and your job is to type the correct
              country name.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h6">How to play</Typography>
            <Typography variant="body2">
              Start a daily challenge or custom run, study the highlighted area,
              type your guess, and submit it before moving to the next round.
            </Typography>
            <Typography variant="body2">
              Custom runs let you choose a mode and pool. You can play broad
              world runs, tighter country-size sets, or focused regional pools.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h6">Modes</Typography>
            <Typography variant="body2">
              Classic is open-ended scoring, 3 Lives ends after three misses,
              Capitals swaps countries for capital-city answers, and Streak ends
              on the first mistake.
            </Typography>
          </Stack>
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
