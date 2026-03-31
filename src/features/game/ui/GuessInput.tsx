import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { matchSorter } from 'match-sorter';
import { useRef, useState } from 'react';
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
  const hintRef = useRef('');
  const [value, setValue] = useState<CountryProperties | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  function updateHint(nextValue: string) {
    const matchingOption = options.find((option) =>
      option.nameEn.toLowerCase().startsWith(nextValue.toLowerCase()),
    );

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
        if (value) {
          onSubmit(value.nameEn);
        }
      }}
      sx={{ display: 'grid', gap: 2, width: '100%', maxWidth: 360 }}
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
        value={value ?? undefined}
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
            hintRef.current = nextValue.nameEn;
          }
        }}
        onClose={() => setOpen(false)}
        onInputChange={(_event, nextInputValue) => {
          setInputValue(nextInputValue);
          updateHint(nextInputValue);
          setOpen(nextInputValue.trim().length > 0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab' && hintRef.current) {
            const matchingOption = options.find((option) =>
              option.nameEn.toLowerCase() === hintRef.current.toLowerCase(),
            );

            if (matchingOption) {
              setInputValue(matchingOption.nameEn);
              setValue(matchingOption);
              setOpen(false);
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
              onChange={(event) => {
                const nextValue = event.target.value;
                setInputValue(nextValue);
                updateHint(nextValue);
              }}
            />
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.45)',
                left: 16,
                overflow: 'hidden',
                pointerEvents: 'none',
                position: 'absolute',
                right: 16,
                top: 18,
                whiteSpace: 'nowrap',
              }}
            >
              {hintRef.current}
            </Typography>
          </Box>
        )}
        renderOption={(props, option, state) => {
          const matches = match(option.nameEn, state.inputValue, {
            insideWords: true,
          });
          const parts = parse(option.nameEn, matches) as HighlightPart[];

          return (
            <Box component="li" {...props}>
              {parts.map((part) => (
                <Box
                  component="span"
                  key={`${part.text}-${part.highlight}`}
                  sx={{ fontWeight: part.highlight ? 700 : 400 }}
                >
                  {part.text}
                </Box>
              ))}
            </Box>
          );
        }}
      />
    </Box>
  );
}
