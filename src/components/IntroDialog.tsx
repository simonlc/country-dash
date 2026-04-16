import { useAppearance } from '@/app/appearance';
import { useI18n } from '@/app/i18n';
import { designTokens } from '@/app/designSystem';
import { m } from '@/paraglide/messages.js';
import { getThemeSurfaceStyles } from '@/app/theme';
import { HowToPlayDialog } from '@/components/HowToPlayDialog';
import type {
  CountrySizeFilter,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  RegionFilter,
} from '@/types/game';
import { getFloatingPanelSx, getSelectorCardSx } from '@/utils/controlStyles';
import {
  formatDailyResetCountdown,
  randomRunPresetDifficulties,
} from '@/utils/gameLogic';
import {
  countrySizeFilters,
  getCountrySizeLabel,
  getModeLabel,
  getRegionLabel,
} from '@/utils/labelTranslations';
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
  icon: typeof Circle;
  value: GameMode;
}> = [
  {
    icon: Circle,
    value: 'classic',
  },
  {
    icon: Heart,
    value: 'threeLives',
  },
  {
    icon: MapPin,
    value: 'capitals',
  },
  {
    icon: Triangle,
    value: 'streak',
  },
];

function getDifficultyLabel(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return m.difficulty_easy();
    case 'medium':
      return m.difficulty_medium();
    case 'hard':
      return m.difficulty_hard();
    case 'veryHard':
      return m.difficulty_very_hard();
  }
}

const categoryOptions: Array<{
  icon: typeof Globe;
  value: RegionFilter;
}> = [
  {
    icon: MapPin,
    value: 'microstates',
  },
  {
    icon: Compass,
    value: 'islandNations',
  },
  {
    icon: Map,
    value: 'caribbean',
  },
  {
    icon: Crop,
    value: 'middleEast',
  },
  {
    icon: Globe,
    value: 'africa',
  },
  {
    icon: Globe,
    value: 'asia',
  },
  {
    icon: Globe,
    value: 'europe',
  },
  {
    icon: Globe,
    value: 'northAmerica',
  },
  {
    icon: Globe,
    value: 'southAmerica',
  },
  {
    icon: Globe,
    value: 'oceania',
  },
];

function getSelectedPoolLabel(
  countrySizeFilter: CountrySizeFilter,
  regionFilter: RegionFilter | null,
) {
  if (regionFilter) {
    return getRegionLabel(regionFilter);
  }

  return getCountrySizeLabel(countrySizeFilter);
}

function formatCompletedDate(locale: string, value: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCountryCountLabel(count: number) {
  return count === 1
    ? m.country_count_single({ count })
    : m.country_count_plural({ count });
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
    const isCompactLayout = useMediaQuery(theme.breakpoints.down('sm'));
    const { locale } = useI18n();
    const { activeTheme } = useAppearance();
    const [mode, setMode] = useState<GameMode>('classic');
    const [countrySizeFilter, setCountrySizeFilter] =
      useState<CountrySizeFilter>('mixed');
    const [regionFilter, setRegionFilter] = useState<RegionFilter | null>(null);
    const [dailyResetCountdownLabel, setDailyResetCountdownLabel] = useState(
      () => formatDailyResetCountdown(),
    );
    const panelSurface = getThemeSurfaceStyles(activeTheme);
    const introPanelWidth = designTokens.layout.panelMaxWidth.dialog;

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
    const sizeItems = countrySizeFilters.map((key) => ({
      description:
        key === 'large'
          ? m.intro_pool_size_large_description({
              countLabel: formatCountryCountLabel(counts[key]),
            })
          : key === 'mixed'
            ? m.intro_pool_size_mixed_description({
                countLabel: formatCountryCountLabel(counts[key]),
              })
            : m.intro_pool_size_small_description({
                countLabel: formatCountryCountLabel(counts[key]),
              }),
      detail: getDifficultyLabel(randomRunPresetDifficulties[key]),
      icon: key === 'large' ? Globe : key === 'mixed' ? Map : Clock,
      label: getCountrySizeLabel(key),
      meta: formatCountryCountLabel(counts[key]),
      selected: regionFilter === null && countrySizeFilter === key,
      value: key,
    }));
    const categoryItems = categoryOptions.map((option) => ({
      description:
        option.value === 'microstates'
          ? m.intro_region_microstates_description()
          : option.value === 'islandNations'
            ? m.intro_region_island_nations_description()
            : option.value === 'caribbean'
              ? m.intro_region_caribbean_description()
              : option.value === 'middleEast'
                ? m.intro_region_middle_east_description()
                : option.value === 'africa'
                  ? m.intro_region_africa_description()
                  : option.value === 'asia'
                    ? m.intro_region_asia_description()
                    : option.value === 'europe'
                      ? m.intro_region_europe_description()
                      : option.value === 'northAmerica'
                        ? m.intro_region_north_america_description()
                        : option.value === 'southAmerica'
                          ? m.intro_region_south_america_description()
                          : m.intro_region_oceania_description(),
      label: getRegionLabel(option.value),
      meta: formatCountryCountLabel(categoryCounts[option.value]),
      selected: regionFilter === option.value,
      value: option.value,
    }));

    return (
      <Dialog
        fullScreen={isCompactLayout}
        fullWidth={isCompactLayout}
        maxWidth="md"
        open={modal.visible}
        PaperProps={{
          sx: {
            borderRadius: { md: designTokens.radius.lg, xs: 0 },
            blockSize: { md: 'auto', xs: '100dvh' },
            maxInlineSize: { md: introPanelWidth, xs: '100%' },
            m: { xs: 0 },
            overflow: 'hidden',
            inlineSize: {
              md: `min(${introPanelWidth}px, calc(100% - 64px))`,
              xs: '100%',
            },
          },
        }}
      >
        <DialogContent
          sx={{
            paddingBlockEnd: {
              md: designTokens.layout.floatingOffset.desktopBottom,
              xs: 'max(env(safe-area-inset-bottom), 10px)',
            },
            paddingBlockStart: {
              md: designTokens.layout.floatingOffset.desktopTop,
              xs: 'max(env(safe-area-inset-top), 8px)',
            },
            paddingInline: { md: 3, xs: 1 },
          }}
        >
          <Stack spacing={2} sx={{ inlineSize: '100%' }}>
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
                <Typography variant="h2">{m.app_name()}</Typography>
                <Typography
                  color="text.secondary"
                  sx={{ maxInlineSize: { md: 420, xs: 'none' } }}
                  variant="body2"
                >
                  {m.app_subtitle()}
                </Typography>
                <Box>
                  <Button
                    size="small"
                    startIcon={<Info />}
                    onClick={() => {
                      void NiceModal.show(HowToPlayDialog);
                    }}
                  >
                    {m.action_how_to_play()}
                  </Button>
                </Box>
              </Stack>

                <Paper
                  elevation={0}
                  sx={{
                    ...panelSurface,
                    ...getFloatingPanelSx({ compact: isCompactLayout, maxWidth: '100%' }),
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
                    padding: { md: 2, xs: 1.75 },
                    inlineSize: '100%',
                    '&::before': {
                      background: `radial-gradient(circle, rgba(242, 179, 90, ${
                        activeTheme.mode === 'light' ? '0.16' : '0.12'
                      }), rgba(242, 179, 90, 0) 68%)`,
                      content: '""',
                      blockSize: 120,
                      inlineSize: 120,
                      insetBlockStart: -46,
                      insetInlineEnd: -48,
                      position: 'absolute',
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
                          {m.game_daily_complete_short_label()}
                        </Typography>
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
                          {m.game_done_today()}
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
                      <Stack spacing={0.15} sx={{ textAlign: 'end' }}>
                        <Typography color="text.secondary" variant="body2">
                          {m.game_finished()}
                        </Typography>
                        <Typography variant="caption">
                          {dailyResult
                            ? formatCompletedDate(locale, dailyResult.completedAt)
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
                          {m.country_count_plural_label()}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}

                  {dailySummary ? (
                    <Typography color="text.secondary" variant="body2">
                      {m.game_today_finished_reset({
                        countdown: dailyResetCountdownLabel,
                      })}
                    </Typography>
                  ) : (
                    <Stack spacing={0.6}>
                      <Typography color="text.secondary" variant="body2">
                        {m.game_resets_in({ countdown: dailyResetCountdownLabel })}
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
                        {m.action_start_daily_challenge()}
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
                  ...getFloatingPanelSx({ compact: isCompactLayout, maxWidth: '100%' }),
                  borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.sm },
                  padding: { md: 2.25, xs: 2 },
                }}
              >
                <Stack spacing={1.75}>
                  <Stack spacing={0.25}>
                    <Typography variant="h5">{m.game_new_game()}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {m.game_new_game_subtitle()}
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
                          aria-label={getModeLabel(option.value)}
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
                            minInlineSize: 0,
                            paddingBlock: designTokens.componentSpacing.selectorCardDense.py,
                            paddingInline: designTokens.componentSpacing.selectorCardDense.px,
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
                                {getModeLabel(option.value)}
                              </Typography>
                            </Box>
                            <Typography
                              color="text.secondary"
                              sx={{ display: 'block' }}
                              variant="caption"
                            >
                              {option.value === 'classic'
                                ? m.intro_mode_classic_description()
                                : option.value === 'threeLives'
                                  ? m.intro_mode_three_lives_description()
                                  : option.value === 'capitals'
                                    ? m.intro_mode_capitals_description()
                                    : m.intro_mode_streak_description()}
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>

                  <Typography color="text.secondary" variant="overline">
                    {m.game_pool_country_pools()}
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
                            aria-label={m.intro_pool_option_aria({
                              description: item.description,
                              label: item.label,
                              meta: item.meta,
                            })}
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
                            minInlineSize: 0,
                            paddingBlock: designTokens.componentSpacing.selectorCardLarge.py,
                            paddingInline: designTokens.componentSpacing.selectorCardLarge.px,
                            textAlign: 'start',
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
                            aria-label={m.intro_region_option_aria({
                              description: item.description,
                              label: item.label,
                              meta: item.meta,
                            })}
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
                              minInlineSize: 0,
                              paddingBlock: 0.55,
                              paddingInline: 0,
                              position: 'relative',
                              textAlign: 'start',
                              transition:
                                'color 180ms ease, opacity 180ms ease',
                              '&::before': {
                                backgroundColor: item.selected
                                  ? activeTheme.palette.primary
                                  : 'divider',
                                borderRadius: 999,
                                content: '""',
                                blockSize: item.selected ? 7 : 6,
                                insetBlockStart: 12,
                                insetInlineStart: 0,
                                inlineSize: item.selected ? 16 : 6,
                                opacity: item.selected ? 1 : 0.45,
                                position: 'absolute',
                                transition:
                                  'background-color 180ms ease, opacity 180ms ease, inline-size 180ms ease, block-size 180ms ease',
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
                              sx={{ paddingInlineStart: item.selected ? 2.35 : 1.6 }}
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
                    {m.action_start_with_pool({
                      pool: getSelectedPoolLabel(countrySizeFilter, regionFilter),
                    })}
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
