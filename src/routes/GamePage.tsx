import { Alert, Box, CircularProgress, Container, Stack } from '@mui/material';
import { Globe } from '@/components/Globe';
import { GlobeAdminPanel } from '@/components/GlobeAdminPanel';
import { ThemeMenu } from '@/components/ThemeMenu';
import { CipherTelemetryPanel } from '@/components/CipherTelemetryPanel';
import { GameBackground } from '@/components/GameBackground';
import { GameHud } from '@/components/GameHud';
import { GameStatusPanel } from '@/components/GameStatusPanel';
import { useGamePageState } from '@/hooks/useGamePageState';

export function GamePage() {
  const state = useGamePageState();

  if (state.loadingError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{state.loadingError}</Alert>
      </Container>
    );
  }

  if (state.isLoading || !state.worldData || !state.currentCountry) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'grid',
          minHeight: '100vh',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundImage: state.activeTheme.background.app,
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <GameBackground isAtlas={state.isAtlas} />
      <Box sx={{ height: '100%' }}>
        <Globe
          country={state.currentCountry}
          mode={state.currentMode}
          focusRequest={state.focusRequest}
          height={state.size.height}
          onCipherTrafficStateChange={state.handlers.onCipherTrafficStateChange}
          palette={state.activeTheme.globe}
          quality={state.effectiveQuality}
          rotation={state.rotation}
          themeId={state.activeTheme.id}
          width={state.size.width}
          world={state.worldData.world}
        />
      </Box>
      <ThemeMenu
        onAbout={state.handlers.openAbout}
        onQuit={state.handlers.onReturnToMenu}
        onRefocus={state.handlers.onRefocus}
        onRestart={state.handlers.onPlayAgain}
      />
      {state.adminEnabled ? (
        <GlobeAdminPanel
          key={`${state.activeTheme.id}:${state.resetRevision}`}
          defaultQuality={state.activeTheme.qualityDefaults}
          quality={state.effectiveQuality}
          setQualityPatch={state.setAdminOverridePatch}
          themeLabel={state.activeTheme.label}
          onReset={state.resetAdminOverride}
        />
      ) : null}
      {state.cipherTelemetry ? (
        <CipherTelemetryPanel {...state.cipherTelemetry} />
      ) : null}
      <Container
        maxWidth="lg"
        sx={{
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
          py: { md: 3, xs: 2 },
          zIndex: 1,
        }}
      >
        <Stack
          direction={{ md: 'row', xs: 'column' }}
          justifyContent="space-between"
          spacing={1.25}
        >
          <GameHud
            correct={state.gameState.correct}
            displayAccentSurface={state.displayAccentSurface}
            displayElapsedMs={state.displayElapsedMs}
            displaySurface={state.displaySurface}
            incorrect={state.gameState.incorrect}
            livesRemaining={state.gameState.livesRemaining}
            onRefocus={state.handlers.onRefocus}
            panelSurface={state.panelSurface}
            roundLabel={state.roundLabel}
            runningSince={state.runningSince}
            score={state.gameState.score}
            sessionLabels={state.sessionLabels}
            sessionModeLabel={state.sessionModeLabel}
            sessionSummaryLabel={state.sessionSummaryLabel}
            showRefocus={state.showRefocus}
            streak={state.gameState.streak}
          />
        </Stack>

        <Box
          sx={{
            alignItems: 'center',
            display: 'grid',
            inset: 0,
            justifyItems: 'center',
            pointerEvents: 'none',
            position: 'absolute',
            px: 2,
            py: { md: 4, xs: 2 },
          }}
        >
          <GameStatusPanel
            copyState={state.copyState}
            countryOptions={state.countryOptions}
            dailyShareText={state.dailyShareText}
            displayAccentSurface={state.displayAccentSurface}
            displaySurface={state.displaySurface}
            gameState={state.gameState}
            isCapitalMode={state.isCapitalMode}
            isDailyRun={state.isDailyRun}
            isReviewComplete={state.isReviewComplete}
            onCopyDailyShare={state.handlers.onCopyDailyShare}
            onNextRound={state.handlers.onNextRound}
            onPlayAgain={state.handlers.onPlayAgain}
            onReturnToMenu={state.handlers.onReturnToMenu}
            onSubmit={state.handlers.onSubmit}
            panelSurface={state.panelSurface}
            storedDailyResult={state.storedDailyResult}
            totalRounds={state.totalRounds}
          />
        </Box>
      </Container>
    </Box>
  );
}
