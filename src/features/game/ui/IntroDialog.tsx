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

function formatCompletedDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
          <Stack spacing={2.5}>
            <Stack spacing={0.25}>
              <Typography color="common.white" lineHeight={0.95} variant="h2">
                Country Guesser
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  md: 'minmax(0, 1fr) minmax(0, 1fr)',
                  xs: '1fr',
                },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  background:
                    'radial-gradient(circle at top left, rgba(61,203,169,0.22), rgba(61,203,169,0) 34%), linear-gradient(165deg, rgba(14,39,48,0.98), rgba(8,22,30,0.98))',
                  border: '1px solid rgba(102, 225, 195, 0.2)',
                  borderRadius: 3,
                  color: 'common.white',
                  minHeight: 1,
                  p: { md: 2.5, xs: 2 },
                }}
              >
                <Stack height="100%" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.75}>
                    <Typography color="secondary.light" variant="overline">
                      Daily Challenge
                    </Typography>
                    <Typography lineHeight={1.05} variant="h4">
                      Today&apos;s route
                    </Typography>
                  </Stack>

                  {dailySummary ? (
                    <Paper
                      elevation={0}
                      sx={{
                        background:
                          'linear-gradient(180deg, rgba(83,199,170,0.14), rgba(83,199,170,0.04))',
                        border: '1px solid rgba(102, 225, 195, 0.24)',
                        borderRadius: 2,
                        p: 1.75,
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography color="rgba(213,255,246,0.82)" variant="caption">
                          Completed
                        </Typography>
                        <Typography lineHeight={1} variant="h3">
                          {dailySummary}
                        </Typography>
                        <Typography color="rgba(232,242,255,0.58)" variant="caption">
                          Finished on {formatCompletedDate(dailyResult.completedAt)}.
                        </Typography>
                      </Stack>
                    </Paper>
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(102, 225, 195, 0.18)',
                        borderRadius: 2,
                        p: 1.75,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                        <Stack spacing={0.25}>
                          <Typography color="rgba(213,255,246,0.82)" variant="caption">
                            Route
                          </Typography>
                          <Typography lineHeight={1} variant="h3">
                            5
                          </Typography>
                        </Stack>
                        <Stack spacing={0.25}>
                          <Typography color="rgba(232,242,255,0.78)" variant="body2">
                            countries, fixed seed
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  )}

                  {dailySummary ? (
                    <Typography color="rgba(232,242,255,0.6)" variant="body2">
                      Completed for today.
                    </Typography>
                  ) : (
                    <Button
                      size="large"
                      sx={{
                        alignSelf: 'stretch',
                        background:
                          'linear-gradient(180deg, rgba(91,224,188,1), rgba(44,174,143,1))',
                        boxShadow: '0 18px 40px rgba(27, 123, 102, 0.34)',
                        color: '#05211b',
                        fontWeight: 700,
                        py: 1.25,
                        textTransform: 'none',
                      }}
                      variant="contained"
                      onClick={() => {
                        onStartDaily();
                        void modal.hide();
                      }}
                    >
                      Play today&apos;s daily
                    </Button>
                  )}
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  background:
                    'linear-gradient(160deg, rgba(18,33,47,0.92), rgba(8,18,29,0.92))',
                  border: '1px solid rgba(146, 198, 255, 0.14)',
                  borderRadius: 3,
                  color: 'common.white',
                  p: 2.5,
                }}
              >
                <Stack spacing={2.25}>
                  <Stack spacing={0.5}>
                    <Typography color="primary.light" variant="overline">
                      Random Run
                    </Typography>
                    <Typography variant="h5">Custom run</Typography>
                  </Stack>

                  <Stack spacing={1}>
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
                          borderRadius: 2,
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
                          minHeight: item.isSize ? 148 : 72,
                          px: item.isSize ? 2 : 1.5,
                          py: item.isSize ? 1.75 : 1.1,
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
                        <Stack spacing={item.isSize ? 0.55 : 0.2}>
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

                  <Button
                    size="large"
                    sx={{
                      alignSelf: 'stretch',
                      background:
                        'linear-gradient(180deg, rgba(86,161,255,1), rgba(44,106,225,1))',
                      boxShadow: '0 18px 40px rgba(31, 72, 171, 0.34)',
                      fontWeight: 700,
                      py: 1.25,
                      textTransform: 'none',
                    }}
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
                    Start {getSelectedPoolLabel(countrySizeFilter, regionFilter)}
                  </Button>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  },
);
