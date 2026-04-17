import type { ReactNode } from 'react';

interface HudInfoProps {
  title: ReactNode;
  value: ReactNode;
}

export function HudInfo({ title, value }: HudInfoProps) {
  return (
    <div className="flex flex-col">
      <div>{title}</div>
      <div>{value}</div>
    </div>
  );
}
