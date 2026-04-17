import { CipherTelemetryPanel } from '@/components/CipherTelemetryPanel';
import { useCipherTelemetryState } from './useCipherTelemetryState';

export function CipherTelemetryLayer() {
  const telemetry = useCipherTelemetryState();

  if (!telemetry) {
    return null;
  }

  return <CipherTelemetryPanel {...telemetry} />;
}
