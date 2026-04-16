import { Box, Paper, Stack, Typography } from '@mui/material';

const cipherTelemetryFont =
  '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';

interface CipherTelemetryPanelProps {
  errorMessage: string | null;
  statusColor: string;
  statusLabel: string;
  systemLines: string[];
  tickerText: string;
}

export function CipherTelemetryPanel({
  errorMessage,
  statusColor,
  statusLabel,
  systemLines,
  tickerText,
}: CipherTelemetryPanelProps) {
  return (
    <Box
      sx={{
        inset: 0,
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 1,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          backdropFilter: 'blur(16px)',
          background:
            'linear-gradient(180deg, rgba(4, 18, 19, 0.74), rgba(1, 10, 11, 0.4))',
          border: '1px solid rgba(0, 255, 236, 0.14)',
          bottom: { md: 34, xs: 184 },
          boxShadow:
            'inset 0 0 0 1px rgba(0, 255, 236, 0.05), 0 16px 34px rgba(0, 0, 0, 0.24)',
          display: { md: 'block', xs: 'none' },
          maxWidth: 250,
          position: 'absolute',
          px: 1.6,
          py: 1.4,
          right: 'max(env(safe-area-inset-right), 24px)',
        }}
      >
        <Typography
          sx={{
            color: statusColor,
            fontFamily: cipherTelemetryFont,
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            mb: 0.7,
            textTransform: 'uppercase',
          }}
        >
          {statusLabel}
        </Typography>
        <Typography
          sx={{
            color: '#f6ff9e',
            fontFamily: cipherTelemetryFont,
            fontSize: '0.96rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            mb: 1,
            textTransform: 'uppercase',
          }}
        >
          Heavy Air Grid
        </Typography>
        <Stack spacing={0.45}>
          {systemLines.map((line) => (
            <Typography
              key={line}
              sx={{
                color: 'rgba(153, 255, 236, 0.92)',
                fontFamily: cipherTelemetryFont,
                fontSize: '0.67rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {line}
            </Typography>
          ))}
        </Stack>
        {errorMessage ? (
          <Typography
            sx={{
              color: 'rgba(255, 169, 150, 0.98)',
              fontFamily: cipherTelemetryFont,
              fontSize: '0.63rem',
              letterSpacing: '0.06em',
              mt: 1,
            }}
          >
            {errorMessage}
          </Typography>
        ) : null}
      </Paper>
      <Box
        sx={{
          bottom: {
            md: 12,
            xs: 'max(env(safe-area-inset-bottom), 10px)',
          },
          left: {
            md: 'max(env(safe-area-inset-left), 24px)',
            xs: 'max(env(safe-area-inset-left), 16px)',
          },
          maxWidth: { md: 'min(58vw, 760px)', xs: 'calc(100vw - 32px)' },
          position: 'absolute',
          px: 1.3,
          py: 0.75,
        }}
      >
        <Typography
          sx={{
            color: 'rgba(149, 255, 239, 0.82)',
            fontFamily: cipherTelemetryFont,
            fontSize: '0.63rem',
            letterSpacing: '0.16em',
            textShadow: '0 0 12px rgba(0, 255, 236, 0.2)',
            textTransform: 'uppercase',
          }}
        >
          {tickerText}
        </Typography>
      </Box>
    </Box>
  );
}
