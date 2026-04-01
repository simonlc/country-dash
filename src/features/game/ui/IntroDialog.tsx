import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  countrySizeLabels,
  randomRunPresetDifficulties,
  regionLabels,
} from '@/features/game/logic/gameLogic';
import type {
  CountrySizeFilter,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  RegionFilter,
} from '@/features/game/types';

interface IntroDialogProps {
  counts: Record<CountrySizeFilter, number>;
  dailyResult: DailyChallengeResult | null;
  onStartDaily: () => void;
  onStartRandom: (options: {
    mode: GameMode;
    regionFilter: RegionFilter | null;
    countrySizeFilter: CountrySizeFilter;
  }) => void;
}

const modeDetails: Array<{
  description: string;
  label: string;
  value: GameMode;
}> = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'Open-ended rounds with the full scoring loop.',
  },
  {
    value: 'threeLives',
    label: '3 Lives',
    description: 'Push accuracy before the run collapses.',
  },
  {
    value: 'speedrun',
    label: 'Speedrun',
    description: 'Ten fast rounds with timing pressure.',
  },
  {
    value: 'streak',
    label: 'Streak',
    description: 'One miss ends the run.',
  },
];

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Lower difficulty',
  medium: 'Medium difficulty',
  hard: 'Higher difficulty',
  veryHard: 'Very hard',
};

const categoryOptions: Array<{
  description: string;
  label: string;
  value: RegionFilter;
}> = [
  {
    value: 'microstates',
    label: 'Micro Countries',
    description: 'Tiny targets and high-precision geography.',
  },
  {
    value: 'islandNations',
    label: 'Island Nations',
    description: 'Ocean-heavy runs with distinct coastlines.',
  },
  {
    value: 'caribbean',
    label: 'Caribbean',
    description: 'Clustered islands and coastal memory checks.',
  },
  {
    value: 'middleEast',
    label: 'Middle East',
    description: 'Dense borders and strong regional similarity.',
  },
  {
    value: 'africa',
    label: 'Africa',
    description: 'Every African country in one complete regional pool.',
  },
  {
    value: 'asia',
    label: 'Asia',
    description: 'The full Asian region, from the Gulf to the Pacific.',
  },
  {
    value: 'europe',
    label: 'Europe',
    description: 'The full European region as one complete set.',
  },
  {
    value: 'northAmerica',
    label: 'North America',
    description: 'All North American countries in a single pool.',
  },
  {
    value: 'southAmerica',
    label: 'South America',
    description: 'The complete South American region.',
  },
  {
    value: 'oceania',
    label: 'Oceania',
    description: 'The full Oceania region, islands included.',
  },
];

function getSelectedPoolLabel(
  countrySizeFilter: CountrySizeFilter,
  regionFilter: RegionFilter | null,
) {
  if (regionFilter) {
    return regionLabels[regionFilter];
  }

  return countrySizeLabels[countrySizeFilter];
}

export const IntroDialog = NiceModal.create(
  ({ counts, dailyResult, onStartDaily, onStartRandom }: IntroDialogProps) => {
    const modal = useModal();
    const [mode, setMode] = useState<GameMode>('classic');
    const [countrySizeFilter, setCountrySizeFilter] =
      useState<CountrySizeFilter>('mixed');
    const [regionFilter, setRegionFilter] = useState<RegionFilter | null>(null);

    const dailySummary = useMemo(() => {
      if (!dailyResult) {
        return null;
      }

      return `${dailyResult.correctCount}/${dailyResult.totalCount}`;
    }, [dailyResult]);

    return (
      <Dialog
        fullWidth
        maxWidth="md"
        open={modal.visible}
        PaperProps={{
          sx: {
            background:
              'radial-gradient(circle at top left, rgba(68,156,255,0.18), rgba(68,156,255,0) 26%), radial-gradient(circle at bottom right, rgba(39,218,181,0.14), rgba(39,218,181,0) 24%), linear-gradient(180deg, rgba(8,26,43,0.99), rgba(10,30,46,0.99))',
            border: '1px solid rgba(146, 198, 255, 0.22)',
            borderRadius: 6,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: { md: 4, xs: 2.5 } }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography color="primary.light" variant="overline">
                Randomly Generated Countries
              </Typography>
              <Typography color="common.white" variant="h4">
                Pick a pool
              </Typography>
              <Typography color="rgba(232,242,255,0.72)" variant="body2">
                Choose one preset or one category pool for the run.
              </Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                background:
                  'linear-gradient(160deg, rgba(18,33,47,0.92), rgba(8,18,29,0.92))',
                border: '1px solid rgba(146, 198, 255, 0.14)',
                borderRadius: 4,
                color: 'common.white',
                p: 2.5,
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction={{ md: 'row', xs: 'column' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">Start random run</Typography>
                    <Typography color="rgba(232,242,255,0.64)" variant="body2">
                      {modeDetails.find((option) => option.value === mode)?.label}
                      {' • '}
                      {getSelectedPoolLabel(countrySizeFilter, regionFilter)}
                    </Typography>
                  </Stack>
                  <Button
                    size="large"
                    sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    variant="contained"
                    onClick={() => {
                      onStartRandom({
                        mode,
                        regionFilter,
                        countrySizeFilter,
                      });
                      void modal.hide();
                    }}
                  >
                    Play {getSelectedPoolLabel(countrySizeFilter, regionFilter).toLowerCase()}
                  </Button>
                </Stack>

                <Stack spacing={1.5}>
                  <Stack spacing={0.75}>
                    <Typography color="rgba(232,242,255,0.72)" variant="body2">
                      Pool
                    </Typography>
                    <Typography color="rgba(232,242,255,0.56)" variant="caption">
                      One active choice at a time.
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.25,
                      gridTemplateColumns: {
                        md: 'repeat(12, minmax(0, 1fr))',
                        sm: 'repeat(6, minmax(0, 1fr))',
                        xs: '1fr',
                      },
                    }}
                  >
                    {[
                      ...(Object.keys(countrySizeLabels) as CountrySizeFilter[]).map((key) => ({
                        isSize: true,
                        description: `${counts[key]} random countries with ${difficultyLabels[randomRunPresetDifficulties[key]].toLowerCase()}.`,
                        label: countrySizeLabels[key],
                        meta: `${counts[key]} countries`,
                        selected: regionFilter === null && countrySizeFilter === key,
                        value: key,
                      })),
                      ...categoryOptions.map((option) => ({
                        isSize: false,
                        description: option.description,
                        label: option.label,
                        meta: 'Category pool',
                        selected: regionFilter === option.value,
                        value: option.value,
                      })),
                    ].map((item) => (
                      <Button
                        key={`${item.isSize ? 'size' : 'region'}-${String(item.value)}`}
                        sx={{
                          alignItems: 'flex-start',
                          background: item.isSize
                            ? item.selected
                              ? 'linear-gradient(180deg, rgba(73,151,255,0.34), rgba(14,35,54,0.98))'
                              : 'linear-gradient(180deg, rgba(24,40,58,0.98), rgba(8,18,29,0.98))'
                            : 'rgba(255,255,255,0.02)',
                          borderColor: item.selected
                            ? 'primary.main'
                            : 'rgba(146, 198, 255, 0.16)',
                          borderRadius: 3,
                          boxShadow: item.isSize
                            ? item.selected
                              ? '0 16px 40px rgba(0, 0, 0, 0.24)'
                              : '0 10px 24px rgba(0, 0, 0, 0.18)'
                            : 'none',
                          color: item.selected ? 'common.white' : 'rgba(232,242,255,0.78)',
                          gridColumn: item.isSize
                            ? {
                                md: 'span 4',
                                sm: 'span 2',
                                xs: 'auto',
                              }
                            : {
                                md: 'span 3',
                                sm: 'span 2',
                                xs: 'auto',
                              },
                          justifyContent: 'flex-start',
                          minHeight: item.isSize ? 156 : 76,
                          px: item.isSize ? 2 : 1.5,
                          py: item.isSize ? 2 : 1.25,
                          textAlign: 'left',
                          textTransform: 'none',
                        }}
                        variant={item.selected ? 'contained' : 'outlined'}
                        onClick={() => {
                          if (item.isSize) {
                            setCountrySizeFilter(item.value as CountrySizeFilter);
                            setRegionFilter(null);
                            return;
                          }

                          setRegionFilter(item.value as RegionFilter);
                          setCountrySizeFilter('mixed');
                        }}
                      >
                        <Stack spacing={item.isSize ? 0.75 : 0.25}>
                          <Typography
                            fontWeight={700}
                            variant={item.isSize ? 'h4' : 'body2'}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            color={item.selected ? 'inherit' : 'rgba(232,242,255,0.56)'}
                            variant="caption"
                          >
                            {item.meta}
                          </Typography>
                          <Typography
                            color={item.selected ? 'inherit' : 'rgba(232,242,255,0.66)'}
                            variant="body2"
                          >
                            {item.description}
                          </Typography>
                        </Stack>
                      </Button>
                    ))}
                  </Box>

                  <Stack spacing={1}>
                    <Typography color="rgba(232,242,255,0.72)" variant="body2">
                      Mode
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      {modeDetails.map((option) => (
                        <Button
                          key={option.value}
                          sx={{
                            borderColor:
                              mode === option.value ? 'primary.main' : 'rgba(146, 198, 255, 0.16)',
                            borderRadius: '999px',
                            color:
                              mode === option.value ? 'common.white' : 'rgba(232,242,255,0.78)',
                            px: 1.5,
                            textTransform: 'none',
                          }}
                          variant={mode === option.value ? 'contained' : 'outlined'}
                          onClick={() => setMode(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Box>
                  </Stack>

                  <Stack
                    direction={{ sm: 'row', xs: 'column' }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography color="rgba(232,242,255,0.6)" variant="body2">
                      Daily challenge: {dailySummary ? `completed ${dailySummary}` : 'one seeded 5-country route for today'}
                    </Typography>
                    {dailySummary ? null : (
                      <Button
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                        variant="text"
                        onClick={() => {
                          onStartDaily();
                          void modal.hide();
                        }}
                      >
                        Play today&apos;s daily
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  },
);
