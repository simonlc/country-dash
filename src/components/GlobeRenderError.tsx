interface GlobeRenderErrorProps {
  message: string;
}

export function GlobeRenderError({ message }: GlobeRenderErrorProps) {
  return (
    <div
      className="grid h-full place-items-center p-4"
    >
      <div
        role="alert"
        className="w-full max-w-[480px] rounded-sm border border-[rgba(213,75,65,0.45)] bg-[rgba(213,75,65,0.14)] px-4 py-3 text-sm text-[var(--color-foreground)]"
      >
        {message}
      </div>
    </div>
  );
}
