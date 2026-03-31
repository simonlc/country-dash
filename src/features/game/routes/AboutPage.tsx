import { Button, Container, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useAppearance } from '@/app/appearance';

export function AboutPage() {
  const { activeTheme } = useAppearance();

  return (
    <Container
      maxWidth="md"
      sx={{
        alignItems: 'center',
        display: 'grid',
        minHeight: '100vh',
        py: 8,
      }}
    >
      <Stack
        spacing={3}
        sx={{
          backgroundColor: activeTheme.background.panel,
          border: `1px solid ${activeTheme.background.panelBorder}`,
          borderRadius: 4,
          boxShadow: activeTheme.background.panelShadow,
          p: { md: 4, xs: 3 },
        }}
      >
        <Typography variant="h2">About Country Guesser</Typography>
        <Typography>
          Country Guesser is a globe-based geography game built as a static app
          for GitHub Pages. The current architecture uses React 19, TanStack
          Router, MUI, NiceModal, and a typed game logic layer.
        </Typography>
        <Typography>
          Start a round, identify the highlighted country, and work through the
          weighted difficulty pool.
        </Typography>
        <Button component={Link} to="/" sx={{ alignSelf: 'flex-start' }} variant="contained">
          Back to game
        </Button>
      </Stack>
    </Container>
  );
}
