import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { matchSorter } from 'match-sorter';
import { useRef, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import { normalizeGuess } from '@/features/game/logic/gameLogic';
import type { CountryProperties } from '@/features/game/types';

interface HighlightPart {
  highlight: boolean;
  text: string;
}

interface GuessInputProps {
  options: CountryProperties[];
  onSubmit: (term: string) => void;
}

const filterOptions = (options: CountryProperties[], inputValue: string) =>
  matchSorter(options, inputValue, {
    keys: [
      (item) =>
        `${item.nameEn}, ${item.name ?? ''}, ${item.abbr ?? ''}, ${
          item.nameAlt ?? ''
        }, ${item.formalName ?? ''}`,
      { threshold: matchSorter.rankings.STARTS_WITH, key: 'isocode' },
      { threshold: matchSorter.rankings.STARTS_WITH, key: 'isocode3' },
    ],
  }).slice(0, 5);

export function GuessInput({ options, onSubmit }: GuessInputProps) {
  const { activeTheme } = useAppearance();
  const hintRef = useRef('');
  const [value, setValue] = useState<CountryProperties | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  function getFilteredOptions(nextValue: string) {
    return filterOptions(options, nextValue);
  }

  function updateHint(nextValue: string) {
    const [matchingOption] = getFilteredOptions(nextValue);

    hintRef.current =
      nextValue && matchingOption
        ? nextValue + matchingOption.nameEn.slice(nextValue.length)
        : '';
  }

  return (
    <Box
      component="form"
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const field = event.currentTarget.querySelector('input');
        const submittedValue = value?.nameEn ?? field?.value.trim() ?? inputValue.trim();

        if (submittedValue) {
          onSubmit(submittedValue);
        }
      }}
      sx={{
        display: 'grid',
        gap: 1,
        maxWidth: 520,
        width: '100%',
      }}
    >
      <Autocomplete<CountryProperties, false, true, false>
        autoHighlight
        disableClearable
        disablePortal
        forcePopupIcon={false}
        id="country-guess"
        inputValue={inputValue}
        noOptionsText="No matches"
        open={open}
        openOnFocus={false}
        options={options}
        value={value}
        filterOptions={(allOptions, state) =>
          filterOptions(allOptions, state.inputValue)
        }
        getOptionKey={(country) =>
          country.isocode3 === '-99' ? country.nameEn : country.isocode3
        }
        getOptionLabel={(country) => country.nameEn}
        onBlur={() => {
          hintRef.current = '';
        }}
        onChange={(_event, nextValue) => {
          setValue(nextValue);
          if (nextValue) {
            setInputValue(nextValue.nameEn);
          }
          if (nextValue) {
            hintRef.current = nextValue.nameEn;
          }
        }}
        onClose={() => setOpen(false)}
        onInputChange={(_event, nextInputValue) => {
          setInputValue(nextInputValue);
          const exactMatch =
            options.find(
              (option) =>
                normalizeGuess(option.nameEn) === normalizeGuess(nextInputValue),
            ) ?? undefined;
          setValue(exactMatch);
          updateHint(nextInputValue);
          setOpen(nextInputValue.trim().length > 0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab' && hintRef.current) {
            const [matchingOption] = getFilteredOptions(inputValue);

            if (matchingOption) {
              setInputValue(matchingOption.nameEn);
              setValue(matchingOption);
              hintRef.current = matchingOption.nameEn;
              setOpen(false);
              event.preventDefault();
            }
          }
          if (event.key === 'Enter') {
            const submittedValue = value?.nameEn ?? inputValue.trim();

            if (submittedValue) {
              onSubmit(submittedValue);
              event.preventDefault();
            }
          }
        }}
        renderInput={(params) => (
          <Box sx={{ position: 'relative' }}>
            <TextField
              {...params}
              autoFocus
              label="Guess the country"
              placeholder="France, Japan, Brazil..."
              sx={{
                '& .MuiInputLabel-root': {
                  fontWeight: 700,
                },
                '& .MuiOutlinedInput-root': {
                  background:
                    activeTheme.mode === 'light'
                      ? 'rgba(255,255,255,0.94)'
                      : 'rgba(8,18,30,0.84)',
                  boxShadow:
                    activeTheme.mode === 'light'
                      ? `0 20px 40px ${activeTheme.background.panelBorder}, inset 0 1px 0 rgba(255,255,255,0.9)`
                      : `0 18px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)`,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeTheme.palette.primary,
                    borderWidth: 2,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeTheme.palette.secondary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: activeTheme.palette.secondary,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  py: 2,
                },
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setInputValue(nextValue);
                updateHint(nextValue);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const submittedValue = value?.nameEn ?? inputValue.trim();

                  if (submittedValue) {
                    onSubmit(submittedValue);
                    event.preventDefault();
                  }
                }
              }}
            />
            <Typography
              sx={{
                color:
                  activeTheme.mode === 'light'
                    ? 'rgba(19, 48, 73, 0.28)'
                    : 'rgba(237, 246, 255, 0.24)',
                fontSize: '1.1rem',
                fontWeight: 700,
                left: 18,
                overflow: 'hidden',
                pointerEvents: 'none',
                position: 'absolute',
                right: 18,
                top: 21,
                whiteSpace: 'nowrap',
              }}
            >
              {hintRef.current}
            </Typography>
          </Box>
        )}
        renderOption={(props, option, state) => {
          const { key, ...optionProps } = props;
          const matches = match(option.nameEn, state.inputValue, {
            insideWords: true,
          });
          const parts = parse(option.nameEn, matches) as HighlightPart[];

          return (
            <Box
              key={key}
              component="li"
              {...optionProps}
              sx={{ alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 0 }}>
                {parts.map((part) => (
                  <Box
                    component="span"
                    key={`${part.text}-${part.highlight}`}
                    sx={{ fontWeight: part.highlight ? 700 : 500 }}
                  >
                    {part.text}
                  </Box>
                ))}
                {option.formalName && option.formalName !== option.nameEn ? (
                  <Typography color="text.secondary" variant="caption">
                    {option.formalName}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        }}
      />
    </Box>
  );
}
