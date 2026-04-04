import { Box } from '@mui/material';

interface GameBackgroundProps {
  atlasStyleEnabled: boolean;
}

export function GameBackground({ atlasStyleEnabled }: GameBackgroundProps) {
  if (!atlasStyleEnabled) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(120, 71, 28, 0.18) 0, rgba(120, 71, 28, 0.08) 7%, rgba(120, 71, 28, 0) 15%), radial-gradient(circle at 78% 72%, rgba(98, 58, 23, 0.12) 0, rgba(98, 58, 23, 0.05) 9%, rgba(98, 58, 23, 0) 19%), linear-gradient(180deg, rgba(255,245,220,0.12), rgba(73,43,18,0.2))',
          inset: 0,
          mixBlendMode: 'multiply',
          opacity: 0.42,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          backgroundImage:
            'linear-gradient(90deg, rgba(104, 67, 31, 0.05) 0, rgba(104, 67, 31, 0.05) 1px, transparent 1px), linear-gradient(rgba(104, 67, 31, 0.045) 0, rgba(104, 67, 31, 0.045) 1px, transparent 1px)',
          backgroundPosition: 'center',
          backgroundSize: '72px 72px',
          inset: 0,
          maskImage:
            'radial-gradient(circle at center, black 46%, transparent 86%)',
          opacity: 0.2,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          background:
            'linear-gradient(180deg, rgba(255, 247, 229, 0.18), rgba(98, 57, 17, 0.08))',
          boxShadow:
            'inset 0 0 0 2px rgba(92, 57, 24, 0.12), inset 0 0 120px rgba(87, 54, 20, 0.2)',
          inset: 12,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          backgroundImage:
            'linear-gradient(180deg, rgba(255,245,220,0.08) 0, rgba(255,245,220,0) 38%, rgba(49,29,11,0.1) 100%), linear-gradient(180deg, rgba(0,0,0,0.035) 0, rgba(0,0,0,0.02) 32%, rgba(255,244,211,0.02) 58%, rgba(0,0,0,0.05) 100%)',
          inset: 0,
          mixBlendMode: 'multiply',
          opacity: 0.14,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          background:
            'radial-gradient(circle at center, rgba(0,0,0,0) 54%, rgba(48,28,10,0.08) 78%, rgba(30,16,6,0.2) 100%)',
          inset: 0,
          opacity: 0.6,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          background:
            'linear-gradient(180deg, rgba(92, 56, 24, 0.24), rgba(42, 23, 8, 0.38))',
          boxShadow:
            'inset 0 0 0 1px rgba(178, 132, 75, 0.18), inset 0 0 0 10px rgba(28, 16, 7, 0.18)',
          inset: 0,
          maskImage:
            'radial-gradient(circle at 50% 50%, transparent 0 82%, rgba(0,0,0,0.7) 92%, black 100%)',
          opacity: 0.5,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          background:
            'radial-gradient(circle at 8% 10%, rgba(245, 208, 145, 0.18) 0, rgba(245, 208, 145, 0) 12%), radial-gradient(circle at 92% 16%, rgba(244, 204, 133, 0.14) 0, rgba(244, 204, 133, 0) 10%), radial-gradient(circle at 10% 88%, rgba(70, 39, 12, 0.24) 0, rgba(70, 39, 12, 0) 10%), radial-gradient(circle at 92% 84%, rgba(70, 39, 12, 0.26) 0, rgba(70, 39, 12, 0) 10%)',
          inset: 0,
          mixBlendMode: 'screen',
          opacity: 0.24,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0, rgba(255,244,211,0.018) 18%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.028) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0) 0, rgba(255,255,255,0) 24px, rgba(255,244,211,0.024) 28px, rgba(255,255,255,0) 38px, rgba(0,0,0,0.018) 52px, rgba(255,255,255,0) 66px)',
          inset: 0,
          mixBlendMode: 'screen',
          maskImage:
            'radial-gradient(circle at center, transparent 0 58%, rgba(0,0,0,0.18) 74%, black 100%)',
          opacity: 0.1,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 2,
        }}
      />
    </>
  );
}
