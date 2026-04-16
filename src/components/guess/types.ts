import type { CountryProperties } from '@/types/game';

export interface HighlightPart {
  highlight: boolean;
  text: string;
}

export interface GuessInputProps {
  onSubmit: (term: string) => void;
  options: CountryProperties[];
  variant: 'country' | 'capital';
}

export interface GuessChoice {
  aliases: string[];
  detail: string | null;
  id: string;
  label: string;
}
