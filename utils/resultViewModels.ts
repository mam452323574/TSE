import { isFieldLocked } from '@/constants/premiumFields';
import {
  AnalysisResult,
  DetectedCondition,
  PremiumPotentialHistoryPoint,
  ScanFaceResult,
  SuperScanResult,
} from '@/types';
import {
  formatAge,
  formatBMI,
  formatCalories,
  formatCm,
  formatGrams,
  parseSafeNumber,
  formatPercentage,
  formatPlainNumber,
  formatScore10,
  formatScore100,
  safeGaugeScore,
} from '@/utils/scanFormatters';
import {
  localizeQualitativeLevel,
  localizeSuperScanDisclaimerKey,
  localizeSuperScanSummaryKey,
  localizeVerdict,
  localizeNutritionVitaminKeys,
} from '@/utils/resultLocalization';
import {
  buildLoadingTrajectoryPlaceholder,
  buildLockedTrajectoryTeaser,
  buildThirtyDayProjection,
} from '@/utils/resultProjection';
import type {
  ResultIconToken,
  ResultMetricIconToken,
  ResultScanIconToken,
} from '@/utils/resultIconCatalog';
import { PremiumRenderState } from '@/utils/subscription';

type TranslateFn = (scope: string, options?: Record<string, unknown>) => string;

export type ResultValueVariant = 'numeric' | 'fraction' | 'text';

export interface ResultQuickStatViewModel {
  id: string;
  icon: ResultIconToken;
  label: string;
  value: string;
  valueVariant: ResultValueVariant;
  labelMaxLines?: number;
  valueMaxLines?: number;
  span?: 'half' | 'full';
}

export interface ResultMetricViewModel {
  id: string;
  icon: ResultIconToken;
  title: string;
  value: string;
  valueVariant: ResultValueVariant;
  titleMaxLines?: number;
  valueMaxLines?: number;
  premiumRenderState?: PremiumRenderState;
}

export interface ResultMacroViewModel {
  title: string;
  items: Array<{
    id: string;
    icon: ResultIconToken;
    label: string;
    value: string;
    valueVariant: ResultValueVariant;
  }>;
}

export interface ResultTrajectoryCheckpointViewModel {
  id: string;
  label: string;
  value: string;
  isHighlighted?: boolean;
}

export interface ResultTrajectoryPointViewModel {
  id: string;
  day: number;
  date: string;
  chartValue: number;
  displayValue: number;
}

export interface ResultTrajectoryViewModel {
  shouldRender: boolean;
  premiumRenderState: PremiumRenderState;
  hookLabel: string;
  title: string;
  badgeLabel: string;
  headline: string;
  subtitle: string;
  ctaLabel?: string;
  footnote?: string;
  points: ResultTrajectoryPointViewModel[];
  series: number[];
  checkpoints: ResultTrajectoryCheckpointViewModel[];
}

export interface ScanResultViewModel {
  scanType: ResultScanIconToken;
  typeLabel: string;
  scoreLabel: string;
  score: number;
  quickStats: ResultQuickStatViewModel[];
  metrics: ResultMetricViewModel[];
  premiumMetrics: ResultMetricViewModel[];
  macros?: ResultMacroViewModel;
}

export interface SuperScanResultViewModel {
  globalRiskScore: number;
  analysisSummary: string;
  disclaimerText: string;
  conditions: DetectedCondition[];
}

function metric(
  id: ResultMetricIconToken,
  title: string,
  value: string,
  valueVariant: ResultValueVariant,
  overrides: Partial<ResultMetricViewModel> = {},
): ResultMetricViewModel {
  return {
    id,
    icon: id,
    title,
    value,
    valueVariant,
    titleMaxLines: overrides.titleMaxLines ?? 2,
    valueMaxLines: overrides.valueMaxLines ?? (valueVariant === 'text' ? 3 : 1),
    premiumRenderState: overrides.premiumRenderState,
  };
}

function resolvePremiumMetricRenderState(options: {
  premiumRenderState: PremiumRenderState;
  scanType: 'face' | 'body' | 'nutrition';
  fieldKey: string;
}) {
  if (options.premiumRenderState !== 'locked') {
    return options.premiumRenderState;
  }

  return isFieldLocked(options.scanType, options.fieldKey, false)
    ? 'locked'
    : 'unlocked';
}

function resolvePremiumMetricValue(options: {
  premiumRenderState: PremiumRenderState;
  unlockedValue: string;
  t: TranslateFn;
}) {
  switch (options.premiumRenderState) {
    case 'unlocked':
      return options.unlockedValue;
    case 'loading':
      return options.t('metric_card.loading_value');
    case 'locked':
    default:
      return options.t('metric_card.blurred_text');
  }
}

function quickStat(
  id: ResultMetricIconToken,
  label: string,
  value: string,
  valueVariant: ResultValueVariant,
  overrides: Partial<ResultQuickStatViewModel> = {},
): ResultQuickStatViewModel {
  return {
    id,
    icon: id,
    label,
    value,
    valueVariant,
    labelMaxLines: overrides.labelMaxLines ?? 2,
    valueMaxLines: overrides.valueMaxLines ?? (valueVariant === 'text' ? 3 : 1),
    span: overrides.span ?? 'half',
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveTrajectoryBaseScore(
  analysisData: AnalysisResult | SuperScanResult,
) {
  switch (analysisData.scan_type) {
    case 'face':
      return safeGaugeScore(analysisData.face_score);
    case 'body':
      return safeGaugeScore(analysisData.body_score);
    case 'super_health_v2':
      return safeGaugeScore(analysisData.global_risk_score);
    case 'nutrition':
    default:
      return safeGaugeScore(analysisData.plate_health_score);
  }
}

function resolveTrajectoryScoreLabel(
  analysisData: AnalysisResult | SuperScanResult,
  t: TranslateFn,
) {
  switch (analysisData.scan_type) {
    case 'face':
      return t('scan.face.score_label');
    case 'body':
      return t('scan.body.score_label');
    case 'super_health_v2':
      return t('scan.super.score_label');
    case 'nutrition':
    default:
      return t('scan.nutrition.score_label');
  }
}

export function buildScanResultViewModel(options: {
  analysisData: AnalysisResult;
  t: TranslateFn;
  locale?: string | null;
  premiumRenderState: PremiumRenderState;
  resolveFaceGlowScore: (data: ScanFaceResult) => number | null | undefined;
}) {
  const {
    analysisData,
    t,
    locale,
    premiumRenderState,
    resolveFaceGlowScore,
  } = options;
  const formatOptions = { locale, t };

  switch (analysisData.scan_type) {
    case 'face':
      return {
        scanType: 'face',
        typeLabel: t('scan.face.type_label'),
        scoreLabel: t('scan.face.score_label'),
        score: safeGaugeScore(analysisData.face_score),
        quickStats: [
          quickStat(
            'perceived_age',
            t('common.metrics.perceived_age'),
            formatAge(analysisData.perceived_age, formatOptions),
            'numeric',
          ),
          quickStat(
            'face_shape',
            t('common.metrics.face_shape'),
            localizeQualitativeLevel(
              'face_shape',
              analysisData.face_shape_key,
              t,
              '-',
            ),
            'text',
            { valueMaxLines: 2 },
          ),
        ],
        metrics: [
          metric(
            'symmetry',
            t('common.metrics.symmetry'),
            formatPercentage(analysisData.symmetry_percentage, formatOptions),
            'numeric',
          ),
          metric(
            'fatigue',
            t('common.metrics.fatigue'),
            formatScore100(analysisData.fatigue_level, formatOptions),
            'fraction',
          ),
          metric(
            'hydration',
            t('common.metrics.hydration'),
            formatScore100(analysisData.hydration_level, formatOptions),
            'fraction',
          ),
          metric(
            'photogenic',
            t('common.metrics.photogenic'),
            formatScore10(analysisData.photogenic_score, formatOptions),
            'fraction',
          ),
        ],
        premiumMetrics: [
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'face',
              fieldKey: 'skin_quality_score',
            });

            return metric(
              'skin_quality',
              t('common.metrics.skin_quality'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: formatScore100(analysisData.skin_quality_score, formatOptions),
                t,
              }),
              'fraction',
              {
                premiumRenderState: nextPremiumRenderState,
              },
            );
          })(),
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'face',
              fieldKey: 'energy_score',
            });

            return metric(
              'glow',
              t('common.metrics.glow'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: formatScore10(resolveFaceGlowScore(analysisData), formatOptions),
                t,
              }),
              'fraction',
              { premiumRenderState: nextPremiumRenderState },
            );
          })(),
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'face',
              fieldKey: 'collagen_level',
            });

            return metric(
              'collagen',
              t('common.metrics.collagen'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: formatScore100(analysisData.collagen_level, formatOptions),
                t,
              }),
              'fraction',
              { premiumRenderState: nextPremiumRenderState },
            );
          })(),
        ],
      } satisfies ScanResultViewModel;

    case 'body':
      return {
        scanType: 'body',
        typeLabel: t('scan.body.type_label'),
        scoreLabel: t('scan.body.score_label'),
        score: safeGaugeScore(analysisData.body_score),
        quickStats: [
          quickStat(
            'body_type',
            t('common.metrics.body_type'),
            localizeQualitativeLevel(
              'body_type',
              analysisData.body_type_key,
              t,
              '-',
            ),
            'text',
            { valueMaxLines: 2 },
          ),
          quickStat(
            'muscle_mass',
            t('common.metrics.muscle_mass'),
            localizeQualitativeLevel(
              'muscle_mass',
              analysisData.muscle_mass_key,
              t,
              '-',
            ),
            'text',
            { valueMaxLines: 2 },
          ),
        ],
        metrics: [
          metric(
            'waist',
            t('common.metrics.waist'),
            formatCm(analysisData.waist_estimation_cm, formatOptions),
            'text',
          ),
          metric(
            'strength',
            t('common.metrics.strength'),
            formatScore100(analysisData.strength_index, formatOptions),
            'fraction',
          ),
          metric(
            'bmi',
            t('common.metrics.bmi'),
            formatBMI(analysisData.bmi_estimate, formatOptions),
            'numeric',
          ),
          metric(
            'metabolic_age',
            t('common.metrics.metabolic_age'),
            formatAge(analysisData.metabolic_age, formatOptions),
            'text',
          ),
        ],
        premiumMetrics: [
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'body',
              fieldKey: 'body_fat_percentage',
            });

            return metric(
              'body_fat',
              t('common.metrics.body_fat'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: formatPercentage(analysisData.body_fat_percentage, formatOptions),
                t,
              }),
              'numeric',
              {
                premiumRenderState: nextPremiumRenderState,
              },
            );
          })(),
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'body',
              fieldKey: 'posture_score',
            });

            return metric(
              'posture',
              t('common.metrics.posture'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: formatScore10(analysisData.posture_score, formatOptions),
                t,
              }),
              'fraction',
              { premiumRenderState: nextPremiumRenderState },
            );
          })(),
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'body',
              fieldKey: 'body_symmetry',
            });

            return metric(
              'body_symmetry',
              t('common.metrics.symmetry'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: formatScore100(analysisData.body_symmetry, formatOptions),
                t,
              }),
              'fraction',
              { premiumRenderState: nextPremiumRenderState },
            );
          })(),
        ],
      } satisfies ScanResultViewModel;

    case 'nutrition':
    default:
      return {
        scanType: 'nutrition',
        typeLabel: t('scan.nutrition.type_label'),
        scoreLabel: t('scan.nutrition.score_label'),
        score: safeGaugeScore(analysisData.plate_health_score),
        quickStats: [
          quickStat(
            'calories',
            t('common.metrics.calories'),
            formatCalories(analysisData.calories_estimate, formatOptions),
            'numeric',
          ),
          quickStat(
            'verdict',
            t('common.metrics.verdict'),
            localizeVerdict(analysisData.verdict_key, t, '-'),
            'text',
            { span: 'full', valueMaxLines: 3 },
          ),
        ],
        macros: {
          title: t('scan.nutrition.macros_title'),
          items: [
            {
              id: 'proteins',
              icon: 'proteins',
              label: t('common.metrics.proteins'),
              value: formatGrams(analysisData.protein_grams, formatOptions),
              valueVariant: 'text',
            },
            {
              id: 'carbs',
              icon: 'carbs',
              label: t('common.metrics.carbs'),
              value: formatGrams(analysisData.carbs_grams, formatOptions),
              valueVariant: 'text',
            },
            {
              id: 'fats',
              icon: 'fats',
              label: t('common.metrics.fats'),
              value: formatGrams(analysisData.fat_grams, formatOptions),
              valueVariant: 'text',
            },
          ],
        },
        metrics: [
          metric(
            'satiety',
            t('common.metrics.satiety'),
            formatScore10(analysisData.satiety_index, formatOptions),
            'fraction',
          ),
          metric(
            'ingredients',
            t('common.metrics.ingredient_quality'),
            localizeQualitativeLevel(
              'ingredient_quality',
              analysisData.ingredient_quality_key,
              t,
              '-',
            ),
            'text',
            { valueMaxLines: 2 },
          ),
        ],
        premiumMetrics: [
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'nutrition',
              fieldKey: 'glycemic_index_label',
            });

            return metric(
              'glycemic',
              t('common.metrics.glycemic_index'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: localizeQualitativeLevel(
                  'glycemic_index',
                  analysisData.glycemic_index_key,
                t,
                '-',
                ),
                t,
              }),
              'text',
              {
                premiumRenderState: nextPremiumRenderState,
                valueMaxLines: 2,
              },
            );
          })(),
          (() => {
            const nextPremiumRenderState = resolvePremiumMetricRenderState({
              premiumRenderState,
              scanType: 'nutrition',
              fieldKey: 'main_vitamins',
            });

            return metric(
              'vitamins',
              t('common.metrics.vitamins'),
              resolvePremiumMetricValue({
                premiumRenderState: nextPremiumRenderState,
                unlockedValue: localizeNutritionVitaminKeys(analysisData.main_vitamin_keys, t, {
                  locale,
                  emptyFallback: '-',
                }),
                t,
              }),
              'text',
              {
                premiumRenderState: nextPremiumRenderState,
                valueMaxLines: 3,
              },
            );
          })(),
        ],
      } satisfies ScanResultViewModel;
  }
}

export function buildResultTrajectoryViewModel(options: {
  analysisData: AnalysisResult | SuperScanResult;
  t: TranslateFn;
  locale?: string | null;
  premiumRenderState: PremiumRenderState;
  historicalAverage30d?: number | null;
  recentScoreHistory?: PremiumPotentialHistoryPoint[] | null;
  currentScanDate?: string | null;
}) {
  const { analysisData, t, locale, premiumRenderState } = options;
  const historicalAverage30d = parseSafeNumber(options.historicalAverage30d);
  const currentScore = resolveTrajectoryBaseScore(analysisData);
  const scoreLabel = resolveTrajectoryScoreLabel(analysisData, t);
  const formatOptions = { locale, t };
  const trajectoryKey = 'common.results.trajectory_preview';
  const projection = buildThirtyDayProjection({
    scanType: analysisData.scan_type,
    currentScore,
    currentDate: options.currentScanDate,
    history: options.recentScoreHistory,
    historicalAverage30d,
  });
  const projectedDisplayScore = projection.projectedDisplayValue;
  const hasHistory = projection.hasHistoricalContext;
  const visiblePoints =
    premiumRenderState === 'unlocked'
      ? projection.points
      : premiumRenderState === 'loading'
        ? buildLoadingTrajectoryPlaceholder({
            scanType: analysisData.scan_type,
            currentScore,
            currentDate: options.currentScanDate,
          })
        : buildLockedTrajectoryTeaser({
            scanType: analysisData.scan_type,
            currentScore,
            currentDate: options.currentScanDate,
          });

  return {
    shouldRender: true,
    premiumRenderState,
    hookLabel:
      premiumRenderState === 'loading'
        ? t(`${trajectoryKey}.eyebrow.loading`)
        : hasHistory
          ? t(`${trajectoryKey}.eyebrow.estimated`)
          : t(`${trajectoryKey}.eyebrow.generic`),
    title: t(`${trajectoryKey}.title`),
    badgeLabel:
      premiumRenderState === 'unlocked'
        ? t(`${trajectoryKey}.badge.unlocked`)
        : premiumRenderState === 'loading'
          ? t(`${trajectoryKey}.badge.loading`)
          : t(`${trajectoryKey}.badge.locked`),
    headline:
      premiumRenderState === 'loading'
        ? t(`${trajectoryKey}.headline.loading`)
        : premiumRenderState === 'unlocked'
          ? projection.direction === 'down'
            ? t(`${trajectoryKey}.headline.unlocked.super`, {
                score: formatScore100(projectedDisplayScore, formatOptions),
              })
            : t(`${trajectoryKey}.headline.unlocked.default`, {
                label: scoreLabel,
                score: formatScore100(projectedDisplayScore, formatOptions),
              })
          : projection.direction === 'down'
            ? t(`${trajectoryKey}.headline.locked.super`)
            : t(`${trajectoryKey}.headline.locked.default`),
    subtitle:
      premiumRenderState === 'loading'
        ? t(`${trajectoryKey}.subtitle.loading`)
        : premiumRenderState === 'unlocked'
          ? hasHistory
            ? t(`${trajectoryKey}.subtitle.unlocked.with_history`)
            : t(`${trajectoryKey}.subtitle.unlocked.without_history`)
          : t(`${trajectoryKey}.subtitle.locked`),
    ctaLabel:
      premiumRenderState === 'locked' ? t(`${trajectoryKey}.cta`) : undefined,
    footnote:
      premiumRenderState === 'unlocked' ? t(`${trajectoryKey}.note`) : undefined,
    points: visiblePoints,
    series: visiblePoints.map((point) => point.chartValue),
    checkpoints:
      premiumRenderState === 'unlocked'
        ? [
            {
              id: 'day_0',
              label: t(`${trajectoryKey}.checkpoints.today`),
              value: formatScore100(projection.currentDisplayValue, formatOptions),
            },
            {
              id: 'day_15',
              label: t(`${trajectoryKey}.checkpoints.day_15`),
              value: formatScore100(projection.midpointDisplayValue, formatOptions),
            },
            {
              id: 'day_30',
              label: t(`${trajectoryKey}.checkpoints.day_30`),
              value: formatScore100(projection.projectedDisplayValue, formatOptions),
              isHighlighted: true,
            },
          ]
        : [],
  } satisfies ResultTrajectoryViewModel;
}

const SEVERITY_ORDER: Record<DetectedCondition['severity_key'], number> = {
  high: 0,
  moderate: 1,
  low: 2,
  unknown: 3,
};

export function buildSuperScanResultViewModel(options: {
  analysisData: SuperScanResult;
  t: TranslateFn;
}) {
  const { analysisData, t } = options;

  return {
    globalRiskScore: safeGaugeScore(analysisData.global_risk_score),
    analysisSummary: localizeSuperScanSummaryKey(
      analysisData.summary_key,
      t,
      '-',
    ),
    disclaimerText: localizeSuperScanDisclaimerKey(
      analysisData.disclaimer_key,
      t,
      '-',
    ),
    conditions: [...analysisData.detected_conditions].sort(
      (left, right) =>
        SEVERITY_ORDER[left.severity_key] - SEVERITY_ORDER[right.severity_key],
    ),
  } satisfies SuperScanResultViewModel;
}

export function formatConditionProbability(
  value: number,
  locale?: string | null,
) {
  return `${formatPlainNumber(value, { locale })}%`;
}
