import NiceModal, { useModal } from '@ebay/nice-modal-react';
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
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/app/i18n';
import { m } from '@/paraglide/messages.js';
import { HowToPlayDialog } from '@/components/HowToPlayDialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type {
  CountrySizeFilter,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  RegionFilter,
} from '@/types/game';
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

interface IntroDialogProps {
  categoryCounts: Record<RegionFilter, number>;
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
  { icon: MapPin, value: 'microstates' },
  { icon: Compass, value: 'islandNations' },
  { icon: Map, value: 'caribbean' },
  { icon: Crop, value: 'middleEast' },
  { icon: Globe, value: 'africa' },
  { icon: Globe, value: 'asia' },
  { icon: Globe, value: 'europe' },
  { icon: Globe, value: 'northAmerica' },
  { icon: Globe, value: 'southAmerica' },
  { icon: Globe, value: 'oceania' },
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

export const IntroDialog = NiceModal.create(
  ({
    categoryCounts,
    counts,
    dailyResult,
    onStartDaily,
    onStartRandom,
  }: IntroDialogProps) => {
    const modal = useModal();
    const { locale } = useI18n();
    const [mode, setMode] = useState<GameMode>('classic');
    const [countrySizeFilter, setCountrySizeFilter] =
      useState<CountrySizeFilter>('mixed');
    const [regionFilter, setRegionFilter] = useState<RegionFilter | null>(null);
    const [dailyResetCountdownLabel, setDailyResetCountdownLabel] = useState(
      () => formatDailyResetCountdown(),
    );

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
      <Dialog fullScreen open={modal.visible} size="lg" onClose={() => void modal.hide()}>
        <div className="grid gap-4 pt-[max(env(safe-area-inset-top),8px)] pb-[max(env(safe-area-inset-bottom),10px)]">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
            <div className="grid gap-2">
              <h1 className="m-0 text-3xl font-bold">{m.app_name()}</h1>
              <p className="m-0 text-sm text-[var(--color-muted)]">{m.app_subtitle()}</p>
              <div>
                <Button
                  size="sm"
                  startIcon={<Info />}
                  onClick={() => {
                    void NiceModal.show(HowToPlayDialog);
                  }}
                >
                  {m.action_how_to_play()}
                </Button>
              </div>
            </div>

            <section className="surface-elevated rounded-sm border border-[var(--surface-panel-border)] p-4">
              <div className="grid gap-3">
                <p className="m-0 inline-flex w-fit rounded-full border border-[color:color-mix(in_srgb,var(--color-primary)_36%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#d7902d]">
                  {m.game_daily_complete_short_label()}
                </p>

                {dailySummary ? (
                  <div className="flex min-h-[54px] items-center justify-between gap-4">
                    <div className="grid gap-1">
                      <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#d7902d]">
                        {m.game_done_today()}
                      </p>
                      <p className="m-0 text-3xl font-bold leading-none">{dailySummary}</p>
                    </div>
                    <div className="grid text-end">
                      <p className="m-0 text-sm text-[var(--color-muted)]">{m.game_finished()}</p>
                      <p className="m-0 text-xs">
                        {dailyResult
                          ? formatCompletedDate(locale, dailyResult.completedAt)
                          : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="m-0 text-3xl font-bold leading-none">5</p>
                      <p className="m-0 text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        {m.country_count_plural_label()}
                      </p>
                    </div>
                  </div>
                )}

                {dailySummary ? (
                  <p className="m-0 text-sm text-[var(--color-muted)]">
                    {m.game_today_finished_reset({
                      countdown: dailyResetCountdownLabel,
                    })}
                  </p>
                ) : (
                  <div className="grid gap-2">
                    <p className="m-0 text-sm text-[var(--color-muted)]">
                      {m.game_resets_in({ countdown: dailyResetCountdownLabel })}
                    </p>
                    <Button
                      size="lg"
                      variant="contained"
                      onClick={() => {
                        onStartDaily();
                        void modal.hide();
                      }}
                    >
                      {m.action_start_daily_challenge()}
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="surface-elevated rounded-sm p-4">
            <div className="grid gap-4">
              <div>
                <h2 className="m-0 text-xl font-semibold">{m.game_new_game()}</h2>
                <p className="m-0 text-sm text-[var(--color-muted)]">
                  {m.game_new_game_subtitle()}
                </p>
              </div>

              <div className="grid gap-2">
                <p className="m-0 text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  {m.how_to_play_modes_title()}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {modeDetails.map((option) => {
                    const ModeIcon = option.icon;

                    return (
                      <button
                        aria-label={getModeLabel(option.value)}
                        aria-pressed={mode === option.value}
                        className={`grid min-h-[84px] gap-2 rounded-md border p-3 text-start ${
                          mode === option.value
                            ? 'border-[color:color-mix(in_srgb,var(--color-primary)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_16%,var(--color-card))]'
                            : 'border-[var(--color-border)] bg-[var(--color-card)]'
                        }`}
                        key={option.value}
                        type="button"
                        onClick={() => setMode(option.value)}
                      >
                        <div className="flex items-center gap-2">
                          <ModeIcon aria-hidden size={15} strokeWidth={2} />
                          <span className="text-sm font-medium">{getModeLabel(option.value)}</span>
                        </div>
                        <span className="text-xs text-[var(--color-muted)]">
                          {option.value === 'classic'
                            ? m.intro_mode_classic_description()
                            : option.value === 'threeLives'
                              ? m.intro_mode_three_lives_description()
                              : option.value === 'capitals'
                                ? m.intro_mode_capitals_description()
                                : m.intro_mode_streak_description()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="m-0 text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">
                {m.game_pool_country_pools()}
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                {sizeItems.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <button
                      aria-label={m.intro_pool_option_aria({
                        description: item.description,
                        label: item.label,
                        meta: item.meta,
                      })}
                      aria-pressed={item.selected}
                      className={`grid min-h-[112px] content-start gap-2 rounded-md border p-4 text-start ${
                        item.selected
                          ? 'border-[color:color-mix(in_srgb,var(--color-primary)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_16%,var(--color-card))]'
                          : 'border-[var(--color-border)] bg-[var(--color-card)]'
                      }`}
                      key={`size-${item.value}`}
                      type="button"
                      onClick={() => {
                        setCountrySizeFilter(item.value);
                        setRegionFilter(null);
                      }}
                    >
                      <ItemIcon aria-hidden size={18} strokeWidth={2} />
                      <span className="text-base font-semibold">{item.label}</span>
                      <span className="text-xs text-[var(--color-muted)]">{item.meta}</span>
                      <span className="text-xs text-[var(--color-muted)]">{item.detail}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-3">
                {categoryItems.map((item) => (
                  <button
                    aria-label={m.intro_region_option_aria({
                      description: item.description,
                      label: item.label,
                      meta: item.meta,
                    })}
                    aria-pressed={item.selected}
                    className={`grid gap-0.5 px-0 py-2 text-start ${
                      item.selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
                    }`}
                    key={`region-${item.value}`}
                    type="button"
                    onClick={() => {
                      setRegionFilter(item.value);
                      setCountrySizeFilter('mixed');
                    }}
                  >
                    <span className={`text-sm ${item.selected ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    <span
                      className={`text-xs uppercase tracking-[0.04em] ${
                        item.selected ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      {item.meta}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                size="lg"
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
            </div>
          </section>
        </div>
      </Dialog>
    );
  },
);
