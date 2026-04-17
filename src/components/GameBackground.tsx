interface GameBackgroundProps {
  atlasStyleEnabled: boolean;
}

export function GameBackground({ atlasStyleEnabled }: GameBackgroundProps) {
  if (!atlasStyleEnabled) {
    return null;
  }

  return (
    <>
      <div className="atlas-bg-layer atlas-bg-layer-a" />
      <div className="atlas-bg-layer atlas-bg-layer-b" />
      <div className="atlas-bg-layer atlas-bg-layer-c" />
      <div className="atlas-bg-layer atlas-bg-layer-d" />
      <div className="atlas-bg-layer atlas-bg-layer-e" />
      <div className="atlas-bg-layer atlas-bg-layer-f" />
      <div className="atlas-bg-layer atlas-bg-layer-g" />
      <div className="atlas-bg-layer atlas-bg-layer-h" />
    </>
  );
}
