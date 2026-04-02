import { Alert, Box } from '@mui/material';

interface GlobeRenderErrorProps {
  message: string;
}

export function GlobeRenderError({ message }: GlobeRenderErrorProps) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'grid',
        height: '100%',
        p: 2,
        placeItems: 'center',
      }}
    >
      <Alert severity="error" sx={{ maxWidth: 480 }}>
        {message}
      </Alert>
    </Box>
  );
}
