declare module 'solar-calculator' {
  export function century(date: Date): number;
  export function equationOfTime(centuryValue: number): number;
  export function declination(centuryValue: number): number;
}
