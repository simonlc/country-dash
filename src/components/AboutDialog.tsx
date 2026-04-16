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
import { m } from '@/paraglide/messages.js';
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
            {m.about_overline()}
          </Typography>
          <Typography variant="h4">{m.app_name()}</Typography>
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
              {m.about_description_1()}
            </Typography>
          </Box>
          <Typography>{m.about_description_2()}</Typography>
          <Typography>{m.about_description_3()}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => void modal.hide()}>
          {m.action_close()}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
