import { Button, Container, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

export function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
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
        <Button component={Link} to="/" variant="contained">
          Back to game
        </Button>
      </Stack>
    </Container>
  );
}
