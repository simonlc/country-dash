import { useEffect } from 'react';
import { Globe } from '@/components/Globe';
import { GlobeAdminPanel } from '@/components/GlobeAdminPanel';
import { ThemeMenu } from '@/components/ThemeMenu';
import { CipherTelemetryPanel } from '@/components/CipherTelemetryPanel';
import { FloatingOverlayLayer } from '@/components/FloatingOverlayLayer';
import { GameBackground } from '@/components/GameBackground';
import { GameHud } from '@/components/GameHud';
import { GameStatusPanel } from '@/components/game-status/GameStatusPanel';
import { GuessPanel } from '@/components/guess/GuessPanel';
import { m } from '@/paraglide/messages.js';
import { getThemeLabel } from '@/utils/themeTranslations';
import { useGamePageState } from '@/hooks/useGamePageState';

export function GamePage() {
  const state = useGamePageState();
  const isPlaying = state.gameState.status === 'playing';
  const topHudLayer = (
    <FloatingOverlayLayer
      align="start"
      maxWidth="hud"
    >
      <GameHud
        correct={state.gameState.correct}
        displayElapsedMs={state.displayElapsedMs}
        incorrect={state.gameState.incorrect}
        isKeyboardOpen={state.isKeyboardOpen}
        livesRemaining={state.gameState.livesRemaining}
        onRefocus={state.handlers.onRefocus}
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
      align="end"
      keyboardInset={state.isKeyboardOpen}
      maxWidth="status"
    >
      {isPlaying ? (
        <GuessPanel
          countryOptions={state.countryOptions}
          isCapitalMode={state.isCapitalMode}
          isKeyboardOpen={state.isKeyboardOpen}
          onSubmit={state.handlers.onSubmit}
        />
      ) : (
        <GameStatusPanel
          copyState={state.copyState}
          currentCountryName={state.currentCountryName}
          dailyShareText={state.dailyShareText}
          gameState={state.gameState}
          isCapitalMode={state.isCapitalMode}
          isDailyRun={state.isDailyRun}
          isKeyboardOpen={state.isKeyboardOpen}
          isReviewComplete={state.isReviewComplete}
          onCopyDailyShare={state.handlers.onCopyDailyShare}
          onNextRound={state.handlers.onNextRound}
          onPlayAgain={state.handlers.onPlayAgain}
          onReturnToMenu={state.handlers.onReturnToMenu}
          storedDailyResult={state.storedDailyResult}
          totalRounds={state.totalRounds}
        />
      )}
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
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div
          role="alert"
          className="rounded-sm border border-[rgba(213,75,65,0.45)] bg-[rgba(213,75,65,0.14)] px-4 py-3"
        >
          {m.error_loading_country_data({ details: state.loadingError })}
        </div>
      </div>
    );
  }

  if (state.isLoading || !state.worldData || !state.currentCountry) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        role="status"
        className="grid min-h-screen place-items-center"
      >
        <svg
          aria-label={m.game_loading_country_data()}
          className="h-8 w-8 animate-spin text-[var(--color-primary)]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="fixed left-[var(--visual-viewport-offset-left,0px)] top-[var(--visual-viewport-offset-top,0px)] h-[var(--layout-height,100svh)] min-h-[100svh] w-[var(--layout-width,100vw)] overflow-hidden bg-[image:var(--app-background)]"
    >
      <GameBackground atlasStyleEnabled={state.atlasStyleEnabled} />
      <div className="h-full">
        <Globe
          country={state.currentCountry}
          mode={state.currentMode}
          focusRequest={state.focusRequest}
          height={state.size.visualHeight}
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
      </div>
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
      <div className="pointer-events-none absolute inset-0 z-[1]">
        {topHudLayer}
        {bottomPanelLayer}
      </div>
    </div>
  );
}
