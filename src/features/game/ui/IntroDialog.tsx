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
import {
  Circle,
  Clock,
  Compass,
  Crop,
  Globe,
  Heart,
  Map,
  MapPin,
  Triangle,
} from 'react-feather';
import { useMemo, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import { designTokens } from '@/app/designSystem';
import {
  getThemeAccentSurfaceStyles,
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import {
  countrySizeLabels,
  randomRunPresetDifficulties,
  regionLabels,
} from '@/features/game/logic/gameLogic';
import { getSelectorCardSx } from '@/features/game/ui/controlStyles';
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
  icon: typeof Circle;
  label: string;
  value: GameMode;
}> = [
  {
    description: 'Standard scoring with no life limit.',
    icon: Circle,
    value: 'classic',
    label: 'Classic',
  },
  {
    description: 'Run ends after 3 incorrect answers.',
    icon: Heart,
    value: 'threeLives',
    label: '3 Lives',
  },
  {
    description: 'Guess capital cities instead of countries.',
    icon: MapPin,
    value: 'capitals',
    label: 'Capitals',
  },
  {
    description: 'Build longest correct-answer streak.',
    icon: Triangle,
    value: 'streak',
    label: 'Streak',
  },
];

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  veryHard: 'Very hard',
};

const categoryOptions: Array<{
  icon: typeof Globe;
  label: string;
  value: RegionFilter;
}> = [
  {
    icon: MapPin,
    value: 'microstates',
    label: 'Micro Countries',
  },
  {
    icon: Compass,
    value: 'islandNations',
    label: 'Island Nations',
  },
  {
    icon: Map,
    value: 'caribbean',
    label: 'Caribbean',
  },
  {
    icon: Crop,
    value: 'middleEast',
    label: 'Middle East',
  },
  {
    icon: Globe,
    value: 'africa',
    label: 'Africa',
  },
  {
    icon: Globe,
    value: 'asia',
    label: 'Asia',
  },
  {
    icon: Globe,
    value: 'europe',
    label: 'Europe',
  },
  {
    icon: Globe,
    value: 'northAmerica',
    label: 'North America',
  },
  {
    icon: Globe,
    value: 'southAmerica',
    label: 'South America',
  },
  {
    icon: Globe,
    value: 'oceania',
    label: 'Oceania',
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
    const { activeTheme } = useAppearance();
    const [mode, setMode] = useState<GameMode>('classic');
    const [countrySizeFilter, setCountrySizeFilter] =
      useState<CountrySizeFilter>('mixed');
    const [regionFilter, setRegionFilter] = useState<RegionFilter | null>(null);
    const strongAccentSurface = getThemeAccentSurfaceStyles(
      activeTheme,
      'strong',
    );
    const panelSurface = getThemeSurfaceStyles(activeTheme);
    const displaySurface = getThemeDisplaySurfaceStyles(activeTheme);
    const displayAccentSurface = getThemeDisplaySurfaceStyles(
      activeTheme,
      'accent',
    );

    const dailySummary = useMemo(() => {
      if (!dailyResult) {
        return null;
      }

      return `${dailyResult.correctCount}/${dailyResult.totalCount}`;
    }, [dailyResult]);

    return (
      <Dialog fullWidth maxWidth="md" open={modal.visible}>
        <DialogContent sx={{ p: { md: 4, xs: 2.5 } }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h2">
                Country Guesser
              </Typography>
              <Typography color="text.secondary" maxWidth={520} variant="body2">
                Pick a run and start.
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
                  ...panelSurface,
                  ...strongAccentSurface,
                  borderRadius: designTokens.radius.md,
                  p: { md: 2.25, xs: 2 },
                }}
              >
                <Stack spacing={1.5}>
                  <Stack spacing={0.35}>
                    <Typography variant="overline">Daily Challenge</Typography>
                    <Typography variant="h5">
                      Today&apos;s route
                    </Typography>
                  </Stack>

                  {dailySummary ? (
                    <Paper
                      elevation={0}
                      sx={{
                        ...displayAccentSurface,
                        borderRadius: designTokens.radius.md,
                        p: 1.9,
                      }}
                    >
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box>
                          <Typography color="text.secondary" variant="caption">
                            Completed
                          </Typography>
                          <Typography variant="h4">
                            {dailySummary}
                          </Typography>
                        </Box>
                        <Typography color="text.secondary" variant="caption">
                          {dailyResult
                            ? formatCompletedDate(dailyResult.completedAt)
                            : ''}
                        </Typography>
                      </Stack>
                    </Paper>
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        ...displaySurface,
                        borderRadius: designTokens.radius.md,
                        p: 1.9,
                      }}
                    >
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Typography variant="h4">
                          5
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          countries
                        </Typography>
                      </Stack>
                    </Paper>
                  )}

                  {dailySummary ? (
                    <Typography color="text.secondary" variant="body2">
                      Completed for today.
                    </Typography>
                  ) : (
                    <Button
                      fullWidth
                      size="large"
                      sx={{
                        py: 1.25,
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
                  ...panelSurface,
                  borderRadius: designTokens.radius.md,
                  p: 2.5,
                }}
              >
                <Stack spacing={2.25}>
                  <Stack spacing={0.35}>
                    <Typography variant="overline">Random</Typography>
                    <Typography variant="h5">Custom run</Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    }}
                  >
                    {modeDetails.map((option) => {
                      const ModeIcon = option.icon;

                      return (
                        <Box
                          aria-label={option.label}
                          aria-pressed={mode === option.value}
                          component="button"
                          key={option.value}
                          type="button"
                          sx={{
                            ...getSelectorCardSx(activeTheme, {
                              selected: mode === option.value,
                            }),
                            minHeight: 94,
                            minWidth: 0,
                            px: 1.5,
                            py: 1.1,
                          }}
                          onClick={() => setMode(option.value)}
                        >
                          <Stack spacing={0.45}>
                            <Box
                              sx={{
                                alignItems: 'center',
                                display: 'flex',
                                gap: 0.75,
                              }}
                            >
                              <ModeIcon
                                aria-hidden
                                size={15}
                                strokeWidth={2}
                              />
                              <Typography variant="body2">
                                {option.label}
                              </Typography>
                            </Box>
                            <Typography
                              color="text.secondary"
                              sx={{ display: 'block' }}
                              variant="caption"
                            >
                              {option.description}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: {
                        md: 'repeat(3, minmax(0, 1fr))',
                        sm: 'repeat(3, minmax(0, 1fr))',
                        xs: '1fr',
                      },
                    }}
                  >
                    {[
                      ...(
                        Object.keys(countrySizeLabels) as CountrySizeFilter[]
                      ).map((key) => ({
                        isSize: true,
                        icon:
                          key === 'large'
                            ? Globe
                            : key === 'mixed'
                              ? Map
                              : Clock,
                        description:
                          key === 'large'
                            ? `${counts[key]} random countries with higher difficulty.`
                            : key === 'mixed'
                              ? `${counts[key]} random countries with medium difficulty.`
                              : `${counts[key]} random countries with lower difficulty.`,
                        detail:
                          difficultyLabels[randomRunPresetDifficulties[key]],
                        label: countrySizeLabels[key],
                        meta: `${counts[key]} countries`,
                        selected:
                          regionFilter === null && countrySizeFilter === key,
                        value: key,
                      })),
                      ...categoryOptions.map((option) => ({
                        icon: option.icon,
                        isSize: false,
                        description:
                          option.value === 'microstates'
                            ? 'Tiny targets and high-precision geography.'
                            : option.value === 'islandNations'
                              ? 'Ocean-heavy runs with distinct coastlines.'
                              : option.value === 'caribbean'
                                ? 'Clustered islands and coastal memory checks.'
                                : option.value === 'middleEast'
                                  ? 'Dense borders and strong regional similarity.'
                                  : option.value === 'africa'
                                    ? 'Every African country in one complete regional pool.'
                                    : option.value === 'asia'
                                      ? 'The full Asian region, from the Gulf to the Pacific.'
                                      : option.value === 'europe'
                                        ? 'The full European region as one complete set.'
                                        : option.value === 'northAmerica'
                                          ? 'All North American countries in a single pool.'
                                          : option.value === 'southAmerica'
                                            ? 'The complete South American region.'
                                            : 'The full Oceania region, islands included.',
                        detail: '',
                        label: option.label,
                        meta: '',
                        selected: regionFilter === option.value,
                        value: option.value,
                      })),
                    ].map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <Box
                          aria-label={
                            item.isSize
                              ? `${item.label} ${item.meta} ${item.description}`
                              : `${item.label} Category pool ${item.description}`
                          }
                          aria-pressed={item.selected}
                          component="button"
                          key={`${item.isSize ? 'size' : 'region'}-${String(item.value)}`}
                          type="button"
                          sx={{
                            alignItems: 'flex-start',
                            ...getSelectorCardSx(activeTheme, {
                              selected: item.selected,
                              tone: item.isSize ? 'panel' : 'muted',
                            }),
                            justifyContent: 'flex-start',
                            minHeight: item.isSize ? 124 : 72,
                            minWidth: 0,
                            px: item.isSize ? 2 : 1.75,
                            py: item.isSize ? 1.7 : 1.2,
                            textAlign: 'left',
                          }}
                          onClick={() => {
                            if (item.isSize) {
                              setCountrySizeFilter(
                                item.value as CountrySizeFilter,
                              );
                              setRegionFilter(null);
                              return;
                            }

                            setRegionFilter(item.value as RegionFilter);
                            setCountrySizeFilter('mixed');
                          }}
                        >
                          <Stack spacing={item.isSize ? 0.55 : 0.25}>
                            <ItemIcon
                              aria-hidden
                              size={item.isSize ? 18 : 16}
                              strokeWidth={2}
                            />
                            <Typography variant={item.isSize ? 'h6' : 'body2'}>
                              {item.label}
                            </Typography>
                            {item.meta ? (
                              <Typography
                                color={
                                  item.selected ? 'inherit' : 'text.secondary'
                                }
                                variant="caption"
                              >
                                {item.meta}
                              </Typography>
                            ) : null}
                            {item.detail ? (
                              <Typography
                                color={
                                  item.selected ? 'inherit' : 'text.secondary'
                                }
                                variant="caption"
                              >
                                {item.detail}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>

                  <Button
                    size="large"
                    sx={{
                      alignSelf: 'stretch',
                      py: 1.25,
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
                    Start{' '}
                    {getSelectedPoolLabel(countrySizeFilter, regionFilter)}
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
