import { Alert, Box, CircularProgress, Container, Stack } from '@mui/material';
import { Globe } from '@/components/Globe';
import { GlobeAdminPanel } from '@/components/GlobeAdminPanel';
import { ThemeMenu } from '@/components/ThemeMenu';
import { CipherTelemetryPanel } from '@/components/CipherTelemetryPanel';
import { GameBackground } from '@/components/GameBackground';
import { GameHud } from '@/components/GameHud';
import { GameStatusPanel } from '@/components/GameStatusPanel';
import { m } from '@/paraglide/messages.js';
import { getThemeLabel } from '@/utils/themeTranslations';
import { useGamePageState } from '@/hooks/useGamePageState';

export function GamePage() {
  const state = useGamePageState();
  const mobileHudTopPadding = state.isKeyboardOpen
    ? 'max(env(safe-area-inset-top), 10px)'
    : 'max(env(safe-area-inset-top), 56px)';
  const mobileHudBottomPadding = `calc(max(env(safe-area-inset-bottom), 10px) + ${state.keyboardInset}px)`;
  const mobileStatusBottomPadding = `calc(max(env(safe-area-inset-bottom), 12px) + ${state.keyboardInset}px)`;

  if (state.loadingError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          {m.error_loading_country_data({ details: state.loadingError })}
        </Alert>
      </Container>
    );
  }

  if (state.isLoading || !state.worldData || !state.currentCountry) {
    return (
      <Box
        aria-busy="true"
        aria-live="polite"
        role="status"
        sx={{
          alignItems: 'center',
          display: 'grid',
          minHeight: '100vh',
          placeItems: 'center',
        }}
      >
        <CircularProgress aria-label={m.game_loading_country_data()} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundImage: state.activeTheme.background.app,
        height: '100%',
        minHeight: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <GameBackground atlasStyleEnabled={state.atlasStyleEnabled} />
      <Box sx={{ height: '100%' }}>
        <Globe
          country={state.currentCountry}
          mode={state.currentMode}
          focusRequest={state.focusRequest}
          height={state.size.height}
          onCipherTrafficStateChange={state.handlers.onCipherTrafficStateChange}
          palette={state.effectiveThemeSettings.globe}
          quality={state.effectiveThemeSettings.quality}
          render={state.effectiveThemeSettings.render}
          roundIndex={state.gameState.roundIndex}
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
          defaultSettings={{
            globe: state.activeTheme.globe,
            quality: state.activeTheme.qualityDefaults,
            render: state.activeTheme.render,
          }}
          settings={state.effectiveThemeSettings}
          setSettingsPatch={state.setAdminOverridePatch}
          themeLabel={getThemeLabel(state.activeTheme.id)}
          onReset={state.resetAdminOverride}
        />
      ) : null}
      {state.cipherTelemetry ? (
        <CipherTelemetryPanel {...state.cipherTelemetry} />
      ) : null}
      <Box
        sx={{
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
          pl: {
            md: 3,
            xs: 'max(env(safe-area-inset-left), 0px)',
          },
          pr: {
            md: 3,
            xs: 'max(env(safe-area-inset-right), 0px)',
          },
          pb: {
            md: 3,
            xs: mobileHudBottomPadding,
          },
          pt: {
            md: 3,
            xs: mobileHudTopPadding,
          },
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
            alignItems: 'end',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            pointerEvents: 'none',
            position: 'absolute',
            pl: {
              md: 2,
              xs: 'max(env(safe-area-inset-left), 6px)',
            },
            pr: {
              md: 2,
              xs: 'max(env(safe-area-inset-right), 6px)',
            },
            pb: {
              md: 4,
              xs: mobileStatusBottomPadding,
            },
            pt: { md: 4, xs: 2 },
          }}
        >
          <GameStatusPanel
            copyState={state.copyState}
            countryOptions={state.countryOptions}
            currentCountryName={state.currentCountryName}
            dailyShareText={state.dailyShareText}
            displaySurface={state.displaySurface}
            gameState={state.gameState}
            isCapitalMode={state.isCapitalMode}
            isDailyRun={state.isDailyRun}
            isKeyboardOpen={state.isKeyboardOpen}
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
      </Box>
    </Box>
  );
}
