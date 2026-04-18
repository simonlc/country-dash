import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { m } from '@/paraglide/messages.js';
import { useAppearance } from '@/app/appearance';
import { CipherTelemetryPanel } from '@/components/CipherTelemetryPanel';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import {
  cipherTrafficStateAtom,
  gameStateAtom,
  todayDateKeyAtom,
} from '@/game/state/game-atoms';
import { totalRoundsAtom } from '@/game/state/game-derived-atoms';
import { getModeLabel } from '@/utils/labelTranslations';

function getCipherTrafficStatusLabel(trafficState: CipherTrafficState) {
  if (trafficState.status === 'error') {
    return `${m.cipher_status_link_error()}`;
  }
  if (trafficState.status === 'loading') {
    return `${m.cipher_status_syncing()}`;
  }
  if (trafficState.source === 'cache') {
    return `${m.cipher_status_cached()}`;
  }
  if (trafficState.status === 'live') {
    return `${m.cipher_status_live()}`;
  }
  return `${m.cipher_status_offline()}`;
}

function getCipherTrafficStatusColor(trafficState: CipherTrafficState) {
  if (trafficState.status === 'error') {
    return 'rgba(255, 169, 150, 0.98)';
  }
  if (trafficState.source === 'cache') {
    return 'rgba(248, 255, 182, 0.98)';
  }
  if (trafficState.status === 'live') {
    return 'rgba(149, 255, 239, 0.98)';
  }
  return 'rgba(182, 212, 206, 0.96)';
}

function getSessionModeLabel(gameState: {
  sessionConfig: { mode: 'capitals' | 'classic' | 'streak' | 'threeLives' } | null;
}) {
  if (!gameState.sessionConfig) {
    return `${m.session_mode_none()}`;
  }

  return getModeLabel(gameState.sessionConfig.mode);
}

export function CipherTelemetryLayer() {
  const { activeTheme } = useAppearance();
  const cipherTrafficState = useAtomValue(cipherTrafficStateAtom);
  const gameState = useAtomValue(gameStateAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const todayDateKey = useAtomValue(todayDateKeyAtom);
  const cipherThemeEnabled =
    activeTheme.render.cipherCountryTransitionOpacity > 0 ||
    activeTheme.render.cipherHydroOverlayOpacity > 0 ||
    activeTheme.render.cipherMapAnnotationsOpacity > 0 ||
    activeTheme.render.cipherSelectedCountryOverlayOpacity > 0 ||
    activeTheme.render.cipherTrafficOverlayOpacity > 0 ||
    activeTheme.render.cipherScreenTransitionOverlayOpacity > 0;
  const sessionModeLabel = getSessionModeLabel(gameState);
  const statusLabel = getCipherTrafficStatusLabel(cipherTrafficState);
  const systemLines = useMemo(
    () => [
      `${m.cipher_system_status_label()} // ${statusLabel.toUpperCase()}`,
      `${m.cipher_system_tracks_label()} // ${cipherTrafficState.tracks.length.toString().padStart(2, '0')}`,
      `${m.cipher_system_sync_label()} // ${
        cipherTrafficState.updatedAtMs
          ? m.cipher_system_sync_locked()
          : m.cipher_system_sync_waiting()
      }`,
      `${m.cipher_system_cache_label()} // ${
        cipherTrafficState.cacheAgeMs !== null
          ? `${Math.round(cipherTrafficState.cacheAgeMs / 1000)}S`
          : m.cipher_system_cache_bypass()
      }`,
      `${m.cipher_system_source_label()} // ${cipherTrafficState.source.toUpperCase()}`,
      `${m.cipher_system_filter_label()} // ${m.cipher_system_priority_airspace()}`,
    ],
    [cipherTrafficState, statusLabel],
  );
  const tickerText = useMemo(
    () =>
      [
        m.cipher_ticker_node(),
        m.cipher_ticker_protocol(),
        `${m.cipher_ticker_round_prefix()} ${(gameState.roundIndex + 1).toString().padStart(2, '0')}/${Math.max(totalRounds, 1).toString().padStart(2, '0')}`,
        `${m.cipher_ticker_mode_prefix()} ${sessionModeLabel.toUpperCase()}`,
        `${m.cipher_ticker_airspace_prefix()} ${statusLabel.toUpperCase()}`,
        `${m.cipher_ticker_date_prefix()} ${todayDateKey}`,
      ].join(' // '),
    [gameState.roundIndex, sessionModeLabel, statusLabel, todayDateKey, totalRounds],
  );

  if (!cipherThemeEnabled) {
    return null;
  }

  return (
    <CipherTelemetryPanel
      errorMessage={cipherTrafficState.errorMessage}
      statusColor={getCipherTrafficStatusColor(cipherTrafficState)}
      statusLabel={statusLabel}
      systemLines={systemLines}
      tickerText={tickerText}
    />
  );
}
