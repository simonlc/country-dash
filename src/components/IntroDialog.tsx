import { useAppearance } from '@/app/appearance';
import { designTokens } from '@/app/designSystem';
import { getThemeSurfaceStyles } from '@/app/theme';
import { HowToPlayDialog } from '@/components/HowToPlayDialog';
import type {
  CountrySizeFilter,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  RegionFilter,
} from '@/types/game';
import { getSelectorCardSx } from '@/utils/controlStyles';
import {
  countrySizeLabels,
  formatDailyResetCountdown,
  randomRunPresetDifficulties,
  regionLabels,
} from '@/utils/gameLogic';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import {
  Circle,
  Clock,
  Compass,
  Crop,
  Globe,
  Heart,
  Info,
  Map,
  MapPin,
  Triangle,
} from 'react-feather';

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

const dailyAccentStrong = '#d7902d';

export const IntroDialog = NiceModal.create(
  ({
    categoryCounts,
    counts,
    dailyResult,
    onStartDaily,
    onStartRandom,
  }: IntroDialogProps) => {
    const modal = useModal();
    const theme = useTheme();
    const isCompactLayout = useMediaQuery(theme.breakpoints.down('md'));
    const { activeTheme } = useAppearance();
    const [mode, setMode] = useState<GameMode>('classic');
    const [countrySizeFilter, setCountrySizeFilter] =
      useState<CountrySizeFilter>('mixed');
    const [regionFilter, setRegionFilter] = useState<RegionFilter | null>(null);
    const [dailyResetCountdownLabel, setDailyResetCountdownLabel] = useState(
      () => formatDailyResetCountdown(),
    );
    const panelSurface = getThemeSurfaceStyles(activeTheme);

    useEffect(() => {
      const timerId = window.setInterval(() => {
        setDailyResetCountdownLabel(formatDailyResetCountdown());
      }, 1000);

      return () => {
        window.clearInterval(timerId);
      };
    }, []);

    const dailySummary = useMemo(() => {
      if (!dailyResult) {
        return null;
      }

      return `${dailyResult.correctCount}/${dailyResult.totalCount}`;
    }, [dailyResult]);
    const sizeItems = (
      Object.keys(countrySizeLabels) as CountrySizeFilter[]
    ).map((key) => ({
      description:
        key === 'large'
          ? `${formatCountryCountLabel(counts[key])} with higher difficulty.`
          : key === 'mixed'
            ? `${formatCountryCountLabel(counts[key])} with medium difficulty.`
            : `${formatCountryCountLabel(counts[key])} with lower difficulty.`,
      detail: difficultyLabels[randomRunPresetDifficulties[key]],
      icon: key === 'large' ? Globe : key === 'mixed' ? Map : Clock,
      label: countrySizeLabels[key],
      meta: formatCountryCountLabel(counts[key]),
      selected: regionFilter === null && countrySizeFilter === key,
      value: key,
    }));
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
      <Dialog
        fullScreen={isCompactLayout}
        fullWidth
        maxWidth="md"
        open={modal.visible}
        PaperProps={{
          sx: {
            borderRadius: { md: 9, xs: 0 },
            height: { md: 'auto', xs: '100dvh' },
            maxWidth: { xs: '100%' },
            m: { xs: 0 },
            overflow: 'hidden',
            width: { xs: '100%' },
          },
        }}
      >
        <DialogContent
          sx={{
            pb: { md: 3, xs: 'max(env(safe-area-inset-bottom), 10px)' },
            pt: { md: 3, xs: 'max(env(safe-area-inset-top), 8px)' },
            px: { md: 3, xs: 1 },
          }}
        >
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Box
              sx={{
                alignItems: 'stretch',
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  md: 'minmax(0, 1fr) minmax(280px, 320px)',
                  xs: '1fr',
                },
              }}
            >
              <Stack spacing={0.75}>
                <Typography variant="h2">Country Dash</Typography>
                <Typography
                  color="text.secondary"
                  maxWidth={{ md: 420, xs: 'none' }}
                  variant="body2"
                >
                  The country guessing game
                </Typography>
                <Box>
                  <Button
                    size="small"
                    startIcon={<Info />}
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
                  borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.sm },
                  border: `1px solid rgba(242, 179, 90, ${
                    activeTheme.mode === 'light' ? '0.36' : '0.3'
                  })`,
                  backgroundImage: `radial-gradient(circle at 100% 0%, rgba(242, 179, 90, ${
                    activeTheme.mode === 'light' ? '0.18' : '0.12'
                  }), rgba(242, 179, 90, 0) 38%), radial-gradient(circle at 0% 100%, rgba(242, 179, 90, ${
                    activeTheme.mode === 'light' ? '0.1' : '0.08'
                  }), rgba(242, 179, 90, 0) 34%), linear-gradient(145deg, rgba(242, 179, 90, ${
                    activeTheme.mode === 'light' ? '0.11' : '0.08'
                  }), rgba(242, 179, 90, 0.03) 56%, rgba(242, 179, 90, 0) 100%)`,
                  boxShadow: `${panelSurface.boxShadow}, inset 0 1px 0 rgba(255, 255, 255, ${
                    activeTheme.mode === 'light' ? '0.34' : '0.06'
                  })`,
                  overflow: 'hidden',
                  p: { md: 2, xs: 1.75 },
                  width: '100%',
                  '&::before': {
                    background: `radial-gradient(circle, rgba(242, 179, 90, ${
                      activeTheme.mode === 'light' ? '0.16' : '0.12'
                    }), rgba(242, 179, 90, 0) 68%)`,
                    content: '""',
                    height: 120,
                    position: 'absolute',
                    right: -48,
                    top: -46,
                    width: 120,
                  },
                }}
              >
                <Stack spacing={1.35}>
                  <Stack spacing={0.7}>
                    <Stack
                      alignItems="flex-start"
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Stack spacing={0.25}>
                        <Typography
                          sx={{
                            alignSelf: 'flex-start',
                            backgroundColor: `rgba(242, 179, 90, ${
                              activeTheme.mode === 'light' ? '0.16' : '0.14'
                            })`,
                            border: `1px solid rgba(242, 179, 90, ${
                              activeTheme.mode === 'light' ? '0.36' : '0.3'
                            })`,
                            borderRadius: designTokens.radius.pill,
                            color: dailyAccentStrong,
                            fontWeight: designTokens.fontWeight.bold,
                            letterSpacing: '0.14em',
                            px: 0.9,
                            py: 0.35,
                            textTransform: 'uppercase',
                          }}
                          variant="caption"
                        >
                          Daily
                        </Typography>
                        {/* <Typography */}
                        {/*   sx={{ */}
                        {/*     letterSpacing: '-0.02em', */}
                        {/*     lineHeight: designTokens.lineHeight.tight, */}
                        {/*   }} */}
                        {/*   variant="h4" */}
                        {/* > */}
                        {/*   Daily Challenge */}
                        {/* </Typography> */}
                      </Stack>
                    </Stack>
                  </Stack>

                  {dailySummary ? (
                    <Stack
                      alignItems="center"
                      direction="row"
                      justifyContent="space-between"
                      spacing={2}
                      sx={{
                        minHeight: 54,
                      }}
                    >
                      <Stack spacing={0.05}>
                        <Typography
                          sx={{
                            color: dailyAccentStrong,
                            fontWeight: designTokens.fontWeight.bold,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                          variant="caption"
                        >
                          Done today
                        </Typography>
                        <Typography
                          sx={{
                            letterSpacing: '-0.03em',
                            lineHeight: designTokens.lineHeight.tight,
                          }}
                          variant="h3"
                        >
                          {dailySummary}
                        </Typography>
                      </Stack>
                      <Stack spacing={0.15} sx={{ textAlign: 'right' }}>
                        <Typography color="text.secondary" variant="body2">
                          Finished
                        </Typography>
                        <Typography variant="caption">
                          {dailyResult
                            ? formatCompletedDate(dailyResult.completedAt)
                            : ''}
                        </Typography>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack spacing={0.55}>
                      <Stack
                        alignItems="baseline"
                        direction="row"
                        flexWrap="wrap"
                        spacing={1}
                      >
                        <Typography
                          sx={{
                            letterSpacing: '-0.03em',
                            lineHeight: designTokens.lineHeight.tight,
                          }}
                          variant="h3"
                        >
                          5
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                          variant="caption"
                        >
                          countries
                        </Typography>
                      </Stack>
                    </Stack>
                  )}

                  {dailySummary ? (
                    <Typography color="text.secondary" variant="body2">
                      You already finished today&apos;s run. Next reset in{' '}
                      {dailyResetCountdownLabel} (UTC).
                    </Typography>
                  ) : (
                    <Stack spacing={0.6}>
                      <Typography color="text.secondary" variant="body2">
                        Resets in {dailyResetCountdownLabel} (UTC).
                      </Typography>
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
                        Start daily challenge
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Box>

            <Stack spacing={1.5}>
              <Paper
                elevation={0}
                sx={{
                  ...panelSurface,
                  borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.sm },
                  p: { md: 2.25, xs: 2 },
                }}
              >
                <Stack spacing={1.75}>
                  <Stack spacing={0.25}>
                    <Typography variant="h5">New game</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Choose a mode and which countries to guess from.
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
                            borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.sm },
                            minHeight: 84,
                            minWidth: 0,
                            px: designTokens.componentSpacing.selectorCardDense
                              .px,
                            py: designTokens.componentSpacing.selectorCardDense
                              .py,
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
                              <ModeIcon aria-hidden size={15} strokeWidth={2} />
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

                  <Typography color="text.secondary" variant="overline">
                    Country Pools
                  </Typography>
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
                            borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.sm },
                            justifyContent: 'flex-start',
                            minHeight: 112,
                            minWidth: 0,
                            px: designTokens.componentSpacing.selectorCardLarge
                              .px,
                            py: designTokens.componentSpacing.selectorCardLarge
                              .py,
                            textAlign: 'left',
                          }}
                          onClick={() => {
                            setCountrySizeFilter(item.value);
                            setRegionFilter(null);
                          }}
                        >
                          <Stack spacing={0.55}>
                            <ItemIcon aria-hidden size={18} strokeWidth={2} />
                            <Typography variant="h6">{item.label}</Typography>
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
                                ? activeTheme.palette.primary
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
                                  ? activeTheme.palette.primary
                                  : 'divider',
                                borderRadius: 999,
                                content: '""',
                                height: item.selected ? 7 : 6,
                                left: 0,
                                opacity: item.selected ? 1 : 0.45,
                                position: 'absolute',
                                top: 12,
                                transition:
                                  'background-color 180ms ease, opacity 180ms ease, width 180ms ease, height 180ms ease',
                                width: item.selected ? 16 : 6,
                              },
                              '&:hover': {
                                color: item.selected
                                  ? activeTheme.palette.primary
                                  : 'text.primary',
                              },
                            }}
                            onClick={() => {
                              setRegionFilter(item.value);
                              setCountrySizeFilter('mixed');
                            }}
                          >
                            <Stack
                              spacing={0.15}
                              sx={{ pl: item.selected ? 2.35 : 1.6 }}
                            >
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
