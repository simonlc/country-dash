import { m } from '@/paraglide/messages.js';

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
  const statusClass =
    statusColor === 'rgba(255, 169, 150, 0.98)'
      ? 'text-[rgba(255,169,150,0.98)]'
      : statusColor === 'rgba(248, 255, 182, 0.98)'
        ? 'text-[rgba(248,255,182,0.98)]'
        : statusColor === 'rgba(149, 255, 239, 0.98)'
          ? 'text-[rgba(149,255,239,0.98)]'
          : 'text-[rgba(182,212,206,0.96)]';

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      <div className="hidden max-w-[250px] border border-[rgba(0,255,236,0.14)] bg-[linear-gradient(180deg,rgba(4,18,19,0.74),rgba(1,10,11,0.4))] p-[11px_13px] shadow-[inset_0_0_0_1px_rgba(0,255,236,0.05),0_16px_34px_rgba(0,0,0,0.24)] backdrop-blur-[16px] md:absolute md:bottom-[34px] md:right-[max(env(safe-area-inset-right),24px)] md:block">
        <p className={`m-0 mb-[6px] font-mono text-[0.66rem] uppercase tracking-[0.22em] ${statusClass}`}>
          {statusLabel}
        </p>
        <p className="m-0 mb-[8px] font-mono text-[0.96rem] font-semibold uppercase tracking-[0.1em] text-[#f6ff9e]">
          {m.cipher_heavy_air_grid()}
        </p>
        <div className="grid gap-[3px]">
          {systemLines.map((line) => (
            <p
              className="m-0 font-mono text-[0.67rem] uppercase tracking-[0.1em] text-[rgba(153,255,236,0.92)]"
              key={line}
            >
              {line}
            </p>
          ))}
        </div>
        {errorMessage ? (
          <p className="m-0 mt-[8px] font-mono text-[0.63rem] tracking-[0.06em] text-[rgba(255,169,150,0.98)]">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className="absolute bottom-[max(env(safe-area-inset-bottom),10px)] left-[max(env(safe-area-inset-left),16px)] max-w-[calc(100vw-32px)] px-[10px] py-[6px] md:bottom-3 md:left-[max(env(safe-area-inset-left),24px)] md:max-w-[min(58vw,760px)]">
        <p className="m-0 font-mono text-[0.63rem] uppercase tracking-[0.16em] text-[rgba(149,255,239,0.82)] [text-shadow:0_0_12px_rgba(0,255,236,0.2)]">
          {tickerText}
        </p>
      </div>
    </div>
  );
}
