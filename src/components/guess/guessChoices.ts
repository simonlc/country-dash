import type { Locale } from '@/paraglide/runtime.js';
import type { CountryProperties } from '@/types/game';
import { getCountryDisplayName, getCountryNameCandidates } from '@/utils/countryNames';
import { normalizeGuess } from '@/utils/gameLogic';
import { matchSorter } from 'match-sorter';
import type { GuessChoice } from './types';

const MAX_VISIBLE_RESULTS = 5;

function normalizeText(value: string) {
  return normalizeGuess(value);
}

function buildCapitalChoices(options: CountryProperties[]): GuessChoice[] {
  return options
    .filter(
      (option): option is CountryProperties & { capitalName: string } =>
        Boolean(option.capitalName),
    )
    .map((option) => ({
      aliases: option.capitalAliases ?? [option.capitalName],
      detail: null,
      id: `${option.isocode3}-${option.capitalName}`,
      label: option.capitalName,
    }));
}

function buildCountryChoices(
  options: CountryProperties[],
  locale: Locale,
): GuessChoice[] {
  return options.map((option) => {
    const displayName = getCountryDisplayName(option, locale);
    const hasDifferentFormalName =
      option.formalName && option.formalName !== displayName;
    const detail =
      hasDifferentFormalName && option.formalName ? option.formalName : null;

    return {
      aliases: getCountryNameCandidates(option),
      detail,
      id:
        option.isocode3 === '-99'
          ? `${displayName}-${option.isocode}`
          : option.isocode3,
      label: displayName,
    };
  });
}

export function buildGuessChoices(
  options: CountryProperties[],
  variant: 'country' | 'capital',
  locale: Locale,
): GuessChoice[] {
  switch (variant) {
    case 'capital':
      return buildCapitalChoices(options);
    case 'country':
      return buildCountryChoices(options, locale);
  }
}

function matchesPrefix(choice: GuessChoice, inputValue: string) {
  const normalizedInput = normalizeText(inputValue);

  if (!normalizedInput) {
    return false;
  }

  return choice.aliases.some((alias) =>
    normalizeText(alias).startsWith(normalizedInput),
  );
}

export function labelStartsWithInput(
  choice: GuessChoice,
  inputValue: string,
) {
  return normalizeText(choice.label).startsWith(normalizeText(inputValue));
}

export function filterGuessChoices(options: GuessChoice[], inputValue: string) {
  const matchedOptions = options.filter((option) =>
    matchesPrefix(option, inputValue),
  );

  return matchSorter(matchedOptions, inputValue, {
    keys: [(item) => `${item.label}, ${item.aliases.join(', ')}`],
  }).slice(0, MAX_VISIBLE_RESULTS);
}

export function findExactGuessChoice(
  choices: GuessChoice[],
  inputValue: string,
) {
  return (
    choices.find((choice) =>
      choice.aliases.some(
        (alias) => normalizeGuess(alias) === normalizeGuess(inputValue),
      ),
    ) ?? null
  );
}
