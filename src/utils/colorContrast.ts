interface RgbaColor {
  alpha: number;
  blue: number;
  green: number;
  red: number;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

function clampAlpha(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace('#', '');

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${clampAlpha(alpha)})`;
}

export function parseColor(value: string): RgbaColor {
  const normalized = value.trim();

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);

    if (hex.length !== 6) {
      throw new Error(`Unsupported color format: ${value}`);
    }

    return {
      alpha: 1,
      blue: Number.parseInt(hex.slice(4, 6), 16),
      green: Number.parseInt(hex.slice(2, 4), 16),
      red: Number.parseInt(hex.slice(0, 2), 16),
    };
  }

  const rgbaMatch = normalized.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  );

  if (!rgbaMatch) {
    throw new Error(`Unsupported color format: ${value}`);
  }

  const red = rgbaMatch[1] ?? '0';
  const green = rgbaMatch[2] ?? '0';
  const blue = rgbaMatch[3] ?? '0';
  const alpha = rgbaMatch[4] ?? '1';

  return {
    alpha: clampAlpha(Number.parseFloat(alpha)),
    blue: clampChannel(Number.parseFloat(blue)),
    green: clampChannel(Number.parseFloat(green)),
    red: clampChannel(Number.parseFloat(red)),
  };
}

export function blendColors(foreground: string, background: string) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  const alpha = fg.alpha + bg.alpha * (1 - fg.alpha);

  if (alpha <= 0) {
    return 'rgba(0, 0, 0, 0)';
  }

  const blendChannel = (foregroundChannel: number, backgroundChannel: number) =>
    Math.round(
      (foregroundChannel * fg.alpha +
        backgroundChannel * bg.alpha * (1 - fg.alpha)) /
        alpha,
    );

  return `rgba(${blendChannel(fg.red, bg.red)}, ${blendChannel(
    fg.green,
    bg.green,
  )}, ${blendChannel(fg.blue, bg.blue)}, ${alpha})`;
}

export function resolveColorAgainstBackground(
  foreground: string,
  background: string,
) {
  const fg = parseColor(foreground);
  if (fg.alpha >= 1) {
    return foreground;
  }

  return blendColors(foreground, background);
}

function getRelativeLuminance(value: string) {
  const { blue, green, red } = parseColor(value);
  const transformChannel = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * transformChannel(red) +
    0.7152 * transformChannel(green) +
    0.0722 * transformChannel(blue)
  );
}

export function getContrastRatio(foreground: string, background: string) {
  const solidForeground = resolveColorAgainstBackground(foreground, background);
  const foregroundLuminance = getRelativeLuminance(solidForeground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}
