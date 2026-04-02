export function parseCssColor(color: string) {
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    return {
      alpha: rgbaMatch[4] ? Number(rgbaMatch[4]) : 1,
      rgb: [
        Number(rgbaMatch[1]),
        Number(rgbaMatch[2]),
        Number(rgbaMatch[3]),
      ] as [number, number, number],
    };
  }

  const hex = color.replace('#', '');
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((value) => value + value)
          .join('')
      : hex;

  return {
    alpha: 1,
    rgb: [
      parseInt(fullHex.slice(0, 2), 16),
      parseInt(fullHex.slice(2, 4), 16),
      parseInt(fullHex.slice(4, 6), 16),
    ] as [number, number, number],
  };
}

export function cssColorToVec3(color: string): [number, number, number] {
  const { rgb } = parseCssColor(color);
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

export function withOpacity(color: string, opacity: number) {
  const parsed = parseCssColor(color);
  const alpha = Math.max(0, Math.min(1, opacity));
  return `rgba(${parsed.rgb[0]}, ${parsed.rgb[1]}, ${parsed.rgb[2]}, ${alpha})`;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function shiftColor(
  color: string,
  redShift: number,
  greenShift: number,
  blueShift: number,
  alphaOverride?: number,
) {
  const parsed = parseCssColor(color);
  const alpha = alphaOverride ?? parsed.alpha;
  return `rgba(${clampChannel(parsed.rgb[0] + redShift)}, ${clampChannel(
    parsed.rgb[1] + greenShift,
  )}, ${clampChannel(parsed.rgb[2] + blueShift)}, ${Math.max(
    0,
    Math.min(1, alpha),
  )})`;
}
