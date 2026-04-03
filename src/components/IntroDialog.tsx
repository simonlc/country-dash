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
import { HowToPlayDialog } from '@/components/HowToPlayDialog';
import {
  countrySizeLabels,
  randomRunPresetDifficulties,
  regionLabels,
} from '@/utils/gameLogic';
import { getSelectorCardSx } from '@/utils/controlStyles';
import type {
  CountrySizeFilter,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  RegionFilter,
} from '@/types/game';

interface IntroDialogProps {
  counts: Record<CountrySizeFilter, number>;
  categoryCounts: Record<RegionFilter, number>;
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

function formatCountryCountLabel(count: number) {
  return `${count} ${count === 1 ? 'country' : 'countries'}`;
}

export const IntroDialog = NiceModal.create(
  ({
    categoryCounts,
    counts,
    dailyResult,
    onStartDaily,
    onStartRandom,
  }: IntroDialogProps) => {
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
    const sizeItems = (Object.keys(countrySizeLabels) as CountrySizeFilter[]).map(
      (key) => ({
        description:
          key === 'large'
            ? `${formatCountryCountLabel(counts[key])} with higher difficulty.`
            : key === 'mixed'
              ? `${formatCountryCountLabel(counts[key])} with medium difficulty.`
              : `${formatCountryCountLabel(counts[key])} with lower difficulty.`,
        detail: difficultyLabels[randomRunPresetDifficulties[key]],
        icon:
          key === 'large'
            ? Globe
            : key === 'mixed'
              ? Map
              : Clock,
        label: countrySizeLabels[key],
        meta: formatCountryCountLabel(counts[key]),
        selected: regionFilter === null && countrySizeFilter === key,
        value: key,
      }),
    );
    const categoryItems = categoryOptions.map((option) => ({
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
      label: option.label,
      meta: formatCountryCountLabel(categoryCounts[option.value]),
      selected: regionFilter === option.value,
      value: option.value,
    }));

    return (
      <Dialog fullWidth maxWidth="md" open={modal.visible}>
        <DialogContent sx={{ p: { md: 3, xs: 2 } }}>
          <Stack spacing={2}>
            <Box
              sx={{
                alignItems: 'center',
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  md: 'minmax(0, 1fr) minmax(280px, 320px)',
                  xs: '1fr',
                },
              }}
            >
              <Stack spacing={0.75}>
                <Typography variant="h2">
                  Country Dash
                </Typography>
                <Typography color="text.secondary" maxWidth={420} variant="body2">
                  Choose a run and start.
                </Typography>
                <Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      void NiceModal.show(HowToPlayDialog);
                    }}
                  >
                    How to play
                  </Button>
                </Box>
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  ...panelSurface,
                  ...strongAccentSurface,
                  borderRadius: designTokens.radius.md,
                  p: { md: 2, xs: 1.75 },
                  width: '100%',
                }}
              >
                <Stack spacing={1.25}>
                  <Stack spacing={0.2}>
                    <Typography variant="overline">Daily Challenge</Typography>
                    <Typography variant="h6">Today&apos;s route</Typography>
                  </Stack>

                  {dailySummary ? (
                    <Paper
                      elevation={0}
                      sx={{
                        ...displayAccentSurface,
                        borderRadius: designTokens.radius.md,
                        p: 1.4,
                      }}
                    >
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box>
                          <Typography color="text.primary" variant="caption">
                            Completed
                          </Typography>
                          <Typography variant="h5">
                            {dailySummary}
                          </Typography>
                        </Box>
                        <Typography color="text.primary" variant="caption">
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
                        p: 1.4,
                      }}
                    >
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Typography variant="h5">
                          5
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          countries
                        </Typography>
                      </Stack>
                    </Paper>
                  )}

                  {dailySummary ? (
                    <Typography color="text.primary" variant="body2">
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
            </Box>

            <Stack spacing={1.5}>
              <Paper
                elevation={0}
                sx={{
                  ...panelSurface,
                  borderRadius: designTokens.radius.md,
                  p: { md: 2.25, xs: 2 },
                }}
              >
                <Stack spacing={1.75}>
                  <Stack spacing={0.25}>
                    <Typography variant="h5">Custom run</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Choose a mode and pool.
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: {
                        sm: 'repeat(4, minmax(0, 1fr))',
                        xs: 'repeat(2, minmax(0, 1fr))',
                      },
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
                            minHeight: 84,
                            minWidth: 0,
                            px: designTokens.componentSpacing.selectorCardDense.px,
                            py: designTokens.componentSpacing.selectorCardDense.py,
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
                    {sizeItems.map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <Box
                          aria-label={`${item.label} ${item.meta} ${item.description}`}
                          aria-pressed={item.selected}
                          component="button"
                          key={`size-${item.value}`}
                          type="button"
                          sx={{
                            alignItems: 'flex-start',
                            ...getSelectorCardSx(activeTheme, {
                              selected: item.selected,
                              tone: 'panel',
                            }),
                            justifyContent: 'flex-start',
                            minHeight: 112,
                            minWidth: 0,
                            px: designTokens.componentSpacing.selectorCardLarge.px,
                            py: designTokens.componentSpacing.selectorCardLarge.py,
                            textAlign: 'left',
                          }}
                          onClick={() => {
                            setCountrySizeFilter(item.value);
                            setRegionFilter(null);
                          }}
                        >
                          <Stack spacing={0.55}>
                            <ItemIcon
                              aria-hidden
                              size={18}
                              strokeWidth={2}
                            />
                            <Typography variant="h6">
                              {item.label}
                            </Typography>
                            <Typography
                              color={
                                item.selected ? 'inherit' : 'text.secondary'
                              }
                              variant="caption"
                            >
                              {item.meta}
                            </Typography>
                            <Typography
                              color={
                                item.selected ? 'inherit' : 'text.secondary'
                              }
                              variant="caption"
                            >
                              {item.detail}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>

                  <Stack spacing={0.75}>
                    <Typography color="text.secondary" variant="overline">
                      Country Pools
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          md: 'repeat(3, minmax(0, 1fr))',
                          sm: 'repeat(2, minmax(0, 1fr))',
                          xs: 'repeat(2, minmax(0, 1fr))',
                        },
                        columnGap: 1.25,
                        rowGap: 0.35,
                      }}
                    >
                      {categoryItems.map((item) => {
                        return (
                          <Box
                            aria-label={`${item.label} ${item.meta} Category pool ${item.description}`}
                            aria-pressed={item.selected}
                            component="button"
                            key={`region-${item.value}`}
                            type="button"
                            sx={{
                              alignItems: 'flex-start',
                              appearance: 'none',
                              background: 'transparent',
                              border: 'none',
                              color: item.selected
                                ? 'text.primary'
                                : 'text.secondary',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'flex-start',
                              minWidth: 0,
                              px: 0,
                              py: 0.55,
                              position: 'relative',
                              textAlign: 'left',
                              transition:
                                'color 180ms ease, opacity 180ms ease',
                              '&::before': {
                                backgroundColor: item.selected
                                  ? 'text.primary'
                                  : 'divider',
                                borderRadius: 999,
                                content: '""',
                                height: 6,
                                left: 0,
                                opacity: item.selected ? 1 : 0.45,
                                position: 'absolute',
                                top: 11,
                                transition:
                                  'background-color 180ms ease, opacity 180ms ease',
                                width: 6,
                              },
                              '&:hover': {
                                color: 'text.primary',
                              },
                            }}
                            onClick={() => {
                              setRegionFilter(item.value);
                              setCountrySizeFilter('mixed');
                            }}
                          >
                            <Stack spacing={0.1} sx={{ pl: 1.6 }}>
                              <Typography
                                color="inherit"
                                sx={{
                                  letterSpacing: '0.04em',
                                  lineHeight: 1.1,
                                  opacity: item.selected ? 1 : 0.62,
                                  textTransform: 'uppercase',
                                }}
                                variant="caption"
                              >
                                {item.meta}
                              </Typography>
                              <Typography
                                color="inherit"
                                sx={{
                                  fontWeight: item.selected ? 700 : 500,
                                  lineHeight: 1.25,
                                }}
                                variant="body2"
                              >
                                {item.label}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Stack>

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
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  },
);
