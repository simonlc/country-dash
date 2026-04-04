import { Suspense, lazy } from 'react';
import type { GlobeAdminPanelProps } from '@/components/GlobeAdminPanel.dev';

const GlobeAdminPanelDev =
  import.meta.env.DEV
    ? lazy<typeof import('@/components/GlobeAdminPanel.dev')['default']>(
        () => import('@/components/GlobeAdminPanel.dev'),
      )
    : null;

export function GlobeAdminPanel(props: GlobeAdminPanelProps) {
  if (!import.meta.env.DEV || GlobeAdminPanelDev === null) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GlobeAdminPanelDev {...props} />
    </Suspense>
  );
}
