import { useEffect } from 'react';
import { Alert, Box, CircularProgress, Container } from '@mui/material';
import { designTokens } from '@/app/designSystem';
import { Globe } from '@/components/Globe';
import { GlobeAdminPanel } from '@/components/GlobeAdminPanel';
import { ThemeMenu } from '@/components/ThemeMenu';
import { CipherTelemetryPanel } from '@/components/CipherTelemetryPanel';
import { FloatingOverlayLayer } from '@/components/FloatingOverlayLayer';
import { GameBackground } from '@/components/GameBackground';
import { GameHud } from '@/components/GameHud';
import { GameStatusPanel } from '@/components/GameStatusPanel';
import { m } from '@/paraglide/messages.js';
import { getThemeLabel } from '@/utils/themeTranslations';
import { useGamePageState } from '@/hooks/useGamePageState';

export function GamePage() {
  const state = useGamePageState();
  const keyboardInset = 'max(env(keyboard-inset-height, 0px), var(--keyboard-fallback-inset, 0px))';
  const mobileStatusBottomPadding = state.isKeyboardOpen ? keyboardInset : '0px';
  const globeViewportHeight = state.size.visualHeight;
  const mobileInlineStartInset = 'max(env(safe-area-inset-left), 0px)';
  const mobileInlineEndInset = 'max(env(safe-area-inset-right), 0px)';
  const topHudLayer = (
    <FloatingOverlayLayer
      alignItems="start"
      desktopBlockEndPadding={0}
      desktopBlockStartPadding={designTokens.layout.floatingOffset.desktopTop}
      desktopInlinePadding={designTokens.layout.edgeInset.desktop}
      maxInlineSize={designTokens.layout.panelMaxWidth.hud}
      mobileBlockEndPadding={0}
      mobileBlockStartPadding={0}
      mobileInlineEndInset={mobileInlineEndInset}
      mobileInlineStartInset={mobileInlineStartInset}
    >
      <GameHud
        correct={state.gameState.correct}
        displayAccentSurface={state.displayAccentSurface}
        displayElapsedMs={state.displayElapsedMs}
        displaySurface={state.displaySurface}
        incorrect={state.gameState.incorrect}
        isKeyboardOpen={state.isKeyboardOpen}
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
        topBarMenu={(
          <ThemeMenu
            onAbout={state.handlers.openAbout}
            onQuit={state.handlers.onReturnToMenu}
            onRefocus={state.handlers.onRefocus}
            onRestart={state.handlers.onPlayAgain}
          />
        )}
      />
    </FloatingOverlayLayer>
  );
  const bottomPanelLayer = (
    <FloatingOverlayLayer
      alignItems="end"
      desktopBlockEndPadding={designTokens.layout.floatingOffset.desktopBottom}
      desktopBlockStartPadding={0}
      desktopInlinePadding={designTokens.layout.edgeInset.tablet}
      maxInlineSize={designTokens.layout.panelMaxWidth.status}
      mobileBlockEndPadding={mobileStatusBottomPadding}
      mobileBlockStartPadding={0}
      mobileInlineEndInset={mobileInlineEndInset}
      mobileInlineStartInset={mobileInlineStartInset}
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
    </FloatingOverlayLayer>
  );

  useEffect(() => {
    const lockWindowScroll = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const viewport = window.visualViewport;
    lockWindowScroll();
    window.addEventListener('scroll', lockWindowScroll);
    viewport?.addEventListener('scroll', lockWindowScroll);

    return () => {
      window.removeEventListener('scroll', lockWindowScroll);
      viewport?.removeEventListener('scroll', lockWindowScroll);
    };
  }, []);

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
        blockSize: state.size.height,
        insetBlockStart: 'var(--visual-viewport-offset-top, 0px)',
        insetInlineStart: 'var(--visual-viewport-offset-left, 0px)',
        inlineSize: state.size.width,
        minBlockSize: '100svh',
        overflow: 'hidden',
        position: 'fixed',
      }}
    >
      <GameBackground atlasStyleEnabled={state.atlasStyleEnabled} />
      <Box sx={{ blockSize: globeViewportHeight }}>
        <Globe
          country={state.currentCountry}
          mode={state.currentMode}
          focusRequest={state.focusRequest}
          height={globeViewportHeight}
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
          insetBlockEnd: 0,
          insetBlockStart: 0,
          insetInlineEnd: 0,
          insetInlineStart: 0,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 1,
        }}
      >
        {topHudLayer}
        {bottomPanelLayer}
      </Box>
    </Box>
  );
}
