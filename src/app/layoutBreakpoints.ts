export const desktopLayoutMinWidth = 768;
export const mobileLayoutMaxWidth = desktopLayoutMinWidth - 0.05;
export const mobileLayoutMediaQuery = `(max-width: ${mobileLayoutMaxWidth}px)`;

export function isMobileLayoutWidth(width: number) {
  return width < desktopLayoutMinWidth;
}
