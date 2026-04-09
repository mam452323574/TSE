import {
  AnalysisResult,
  DetectedCondition,
  LegacyDetectedCondition,
  ScanBodyResult,
  ScanCatalogKey,
  ScanFaceResult,
  ScanNutritionResult,
  ScanType,
  ScanVitaminKey,
  StoredAnalysisResult,
  SuperScanCatalogKey,
  SuperScanResult,
} from '@/types';
import {
  BODY_TYPE_CONTRACT,
  FACE_SHAPE_CONTRACT,
  GLYCEMIC_INDEX_CONTRACT,
  INGREDIENT_QUALITY_CONTRACT,
  MUSCLE_MASS_CONTRACT,
  NUTRITION_VITAMIN_CONTRACT,
  SEVERITY_CONTRACT,
  SUPER_ADVICE_CONTRACT,
  SUPER_CATEGORY_CONTRACT,
  SUPER_CONDITION_CONTRACT,
  SUPER_DISCLAIMER_CONTRACT,
  SUPER_EXPLANATION_CONTRACT,
  SUPER_SUMMARY_CONTRACT,
  VERDICT_CONTRACT,
  normalizeContractToken,
  resolveContractKey,
} from '@/constants/resultCatalogContract';
import { resolveLocalizedText } from '@/utils/analysisTextLocalization';

type NormalizeAnalysisOptions = {
  expectedScanType?: ScanType | null;
};

type ScanValueCategory =
  | 'face_shape'
  | 'body_type'
  | 'muscle_mass'
  | 'ingredient_quality'
  | 'glycemic_index'
  | 'severity';

const EXPECTED_ANALYSIS_TYPES: Partial<Record<ScanType, StoredAnalysisResult['scan_type']>> = {
  health: 'face',
  body: 'body',
  nutrition: 'nutrition',
  super: 'super_health_v2',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function readOptionalNumber(value: unknown) {
  if (value == null || value === '') {
    return null;
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeToken(value: string) {
  return normalizeContractToken(value);
}

function resolveText(value: unknown) {
  const directString = readString(value);
  if (directString) {
    return directString;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const localized = resolveLocalizedText(value as never, { fallback: '' });
  return localized.trim().length > 0 ? localized.trim() : null;
}

function readExplicitKey(value: unknown) {
  const key = readString(value);
  return key ? normalizeToken(key) : null;
}

function normalizeAlias(category: ScanValueCategory, value: string | null): ScanCatalogKey {
  const contract =
    category === 'face_shape'
      ? FACE_SHAPE_CONTRACT
      : category === 'body_type'
        ? BODY_TYPE_CONTRACT
        : category === 'muscle_mass'
          ? MUSCLE_MASS_CONTRACT
          : category === 'ingredient_quality'
            ? INGREDIENT_QUALITY_CONTRACT
            : category === 'glycemic_index'
              ? GLYCEMIC_INDEX_CONTRACT
              : SEVERITY_CONTRACT;

  return resolveContractKey(contract, value) as ScanCatalogKey;
}

function normalizeIngredientQualityKey(value: string | null) {
  return resolveContractKey(INGREDIENT_QUALITY_CONTRACT, value) as ScanCatalogKey;
}

function normalizeGlycemicIndexKey(value: string | null) {
  return resolveContractKey(GLYCEMIC_INDEX_CONTRACT, value) as ScanCatalogKey;
}

function normalizeVitaminKey(value: string | null) {
  if (!value) {
    return null;
  }

  return resolveContractKey(NUTRITION_VITAMIN_CONTRACT, value) as ScanVitaminKey;
}

function normalizeVerdictKey(value: string | null) {
  return resolveContractKey(VERDICT_CONTRACT, value) as ScanCatalogKey;
}

function normalizeVitaminKeys(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => {
            const explicitKey = readExplicitKey(item);
            if (explicitKey) {
              return normalizeVitaminKey(explicitKey);
            }

            return normalizeVitaminKey(readString(item));
          })
          .filter((item): item is ScanVitaminKey => !!item)
      )
    );
  }

  const text = resolveText(value);
  if (!text) {
    return [] as ScanVitaminKey[];
  }

  return Array.from(
    new Set(
      text
        .split(/[,;/&+]+|\bet\b|\band\b/gi)
        .map((item) => normalizeVitaminKey(item))
        .filter((item): item is ScanVitaminKey => !!item)
    )
  );
}

function normalizeSummaryKey(value: string | null) {
  return resolveContractKey(SUPER_SUMMARY_CONTRACT, value) as SuperScanCatalogKey;
}

function normalizeDisclaimerKey(value: string | null) {
  return resolveContractKey(SUPER_DISCLAIMER_CONTRACT, value) as SuperScanCatalogKey;
}

function normalizeSuperCategoryKey(value: string | null) {
  return resolveContractKey(SUPER_CATEGORY_CONTRACT, value) as SuperScanCatalogKey;
}

function normalizeSuperConditionKey(value: string | null) {
  return resolveContractKey(SUPER_CONDITION_CONTRACT, value) as SuperScanCatalogKey;
}

function normalizeSuperExplanationKey(value: string | null) {
  return resolveContractKey(SUPER_EXPLANATION_CONTRACT, value) as SuperScanCatalogKey;
}

function normalizeSuperAdviceKey(value: string | null) {
  return resolveContractKey(SUPER_ADVICE_CONTRACT, value) as SuperScanCatalogKey;
}

function normalizeSeverityKey(value: unknown) {
  const explicitKey = readExplicitKey(value);
  if (explicitKey) {
    return resolveContractKey(SEVERITY_CONTRACT, explicitKey) as DetectedCondition['severity_key'];
  }

  return resolveContractKey(
    SEVERITY_CONTRACT,
    resolveText(value)
  ) as DetectedCondition['severity_key'];
}

function normalizeFaceResult(raw: Record<string, unknown>): ScanFaceResult {
  const explicitKey =
    readExplicitKey(raw.face_shape_key) ?? readExplicitKey(raw.face_shape_code);
  const faceShapeText = resolveText(
    raw.face_shape_fallback_text ?? raw.face_shape_i18n ?? raw.face_shape
  );
  const metrics = isPlainObject(raw.metrics) ? raw.metrics : null;

  return {
    schema_version: 3,
    scan_type: 'face',
    face_score: readNumber(raw.face_score),
    perceived_age: readNumber(raw.perceived_age),
    skin_quality_score: readNumber(raw.skin_quality_score),
    symmetry_percentage: readNumber(raw.symmetry_percentage),
    fatigue_level: readNumber(raw.fatigue_level),
    glow_index: readOptionalNumber(
      raw.glow_index ??
        raw.glowScore ??
        raw.glow_score ??
        raw.glow ??
        metrics?.glow ??
        metrics?.glowScore
    ),
    energy_score: readOptionalNumber(raw.energy_score),
    face_shape_key: normalizeAlias('face_shape', explicitKey ?? faceShapeText),
    collagen_level: readNumber(raw.collagen_level),
    hydration_level: readNumber(raw.hydration_level),
    photogenic_score: readNumber(raw.photogenic_score),
  };
}

function normalizeBodyResult(raw: Record<string, unknown>): ScanBodyResult {
  const explicitBodyTypeKey =
    readExplicitKey(raw.body_type_key) ?? readExplicitKey(raw.body_type_code);
  const explicitMuscleMassKey =
    readExplicitKey(raw.muscle_mass_key) ?? readExplicitKey(raw.muscle_mass_code);
  const bodyTypeText = resolveText(
    raw.body_type_fallback_text ?? raw.body_type_i18n ?? raw.body_type
  );
  const muscleMassText = resolveText(
    raw.muscle_mass_fallback_text ?? raw.muscle_mass_label_i18n ?? raw.muscle_mass_label
  );

  return {
    schema_version: 3,
    scan_type: 'body',
    body_score: readNumber(raw.body_score),
    body_fat_percentage: readNumber(raw.body_fat_percentage),
    muscle_mass_key: normalizeAlias('muscle_mass', explicitMuscleMassKey ?? muscleMassText),
    body_type_key: normalizeAlias('body_type', explicitBodyTypeKey ?? bodyTypeText),
    posture_score: readNumber(raw.posture_score),
    waist_estimation_cm: readNumber(raw.waist_estimation_cm),
    strength_index: readNumber(raw.strength_index),
    body_symmetry: readNumber(raw.body_symmetry),
    bmi_estimate: readNumber(raw.bmi_estimate),
    metabolic_age: readNumber(raw.metabolic_age),
  };
}

function normalizeNutritionResult(raw: Record<string, unknown>): ScanNutritionResult {
  const explicitVerdictKey = readExplicitKey(raw.verdict_key);
  const explicitGlycemicKey =
    readExplicitKey(raw.glycemic_index_key) ?? readExplicitKey(raw.glycemic_index_code);
  const explicitIngredientQualityKey =
    readExplicitKey(raw.ingredient_quality_key) ?? readExplicitKey(raw.ingredient_quality_code);
  const verdictText = resolveText(
    raw.verdict_fallback_text ?? raw.short_verdict_i18n ?? raw.short_verdict
  );
  const glycemicText = resolveText(raw.glycemic_index_label_i18n ?? raw.glycemic_index_label);
  const ingredientQualityText = resolveText(raw.ingredient_quality_i18n ?? raw.ingredient_quality);

  return {
    schema_version: 3,
    scan_type: 'nutrition',
    plate_health_score: readNumber(raw.plate_health_score),
    calories_estimate: readNumber(raw.calories_estimate),
    protein_grams: readNumber(raw.protein_grams),
    carbs_grams: readNumber(raw.carbs_grams),
    fat_grams: readNumber(raw.fat_grams),
    verdict_key: normalizeVerdictKey(explicitVerdictKey ?? verdictText),
    glycemic_index_key: normalizeGlycemicIndexKey(explicitGlycemicKey ?? glycemicText),
    satiety_index: readNumber(raw.satiety_index),
    ingredient_quality_key: normalizeIngredientQualityKey(
      explicitIngredientQualityKey ?? ingredientQualityText
    ),
    main_vitamin_keys: normalizeVitaminKeys(
      raw.main_vitamin_keys ??
        raw.main_vitamins_fallback_text ??
        raw.main_vitamins_i18n ??
        raw.main_vitamins
    ),
  };
}

function normalizeDetectedCondition(raw: LegacyDetectedCondition | DetectedCondition): DetectedCondition {
  if ('severity_key' in raw && 'condition_key' in raw) {
    return {
      condition_key: normalizeSuperConditionKey(readString(raw.condition_key)),
      category_key: normalizeSuperCategoryKey(readString(raw.category_key)),
      probability: readNumber(raw.probability),
      severity_key: normalizeSeverityKey(raw.severity_key),
      explanation_key: normalizeSuperExplanationKey(readString(raw.explanation_key)),
      advice_key: normalizeSuperAdviceKey(readString(raw.advice_key)),
    };
  }

  const legacyCondition = raw as LegacyDetectedCondition;
  const rawRecord = raw as unknown as Record<string, unknown>;
  const explicitConditionKey = readExplicitKey(legacyCondition.condition_code);
  const explicitCategoryKey =
    readExplicitKey(rawRecord.category_key) ?? readExplicitKey(legacyCondition.category_code);
  const explicitExplanationKey = readExplicitKey(rawRecord.explanation_key);
  const explicitAdviceKey = readExplicitKey(rawRecord.advice_key);
  const conditionText = resolveText(legacyCondition.condition_name_i18n ?? rawRecord.condition_name);
  const categoryText = resolveText(legacyCondition.category_i18n ?? rawRecord.category);
  const explanationText = resolveText(legacyCondition.explanation_i18n ?? rawRecord.explanation);
  const adviceText = resolveText(
    legacyCondition.actionable_advice_i18n ?? rawRecord.actionable_advice
  );

  return {
    condition_key: normalizeSuperConditionKey(explicitConditionKey ?? conditionText),
    category_key: normalizeSuperCategoryKey(explicitCategoryKey ?? categoryText),
    probability: readNumber(rawRecord.probability),
    severity_key: normalizeSeverityKey(legacyCondition.severity),
    explanation_key: normalizeSuperExplanationKey(explicitExplanationKey ?? explanationText),
    advice_key: normalizeSuperAdviceKey(explicitAdviceKey ?? adviceText),
  };
}

function normalizeSuperScanResult(raw: Record<string, unknown>): SuperScanResult {
  const explicitSummaryKey = readExplicitKey(raw.summary_key);
  const explicitDisclaimerKey = readExplicitKey(raw.disclaimer_key);
  const summaryText = resolveText(
    raw.analysis_summary_i18n ?? raw.summary_fallback_text ?? raw.analysis_summary
  );
  const disclaimerText = resolveText(
    raw.disclaimer_text_i18n ?? raw.disclaimer_fallback_text ?? raw.disclaimer_text
  );
  const detectedConditions = Array.isArray(raw.detected_conditions)
    ? raw.detected_conditions
        .filter(isPlainObject)
        .map((condition) =>
          normalizeDetectedCondition(condition as unknown as LegacyDetectedCondition)
        )
    : [];

  return {
    schema_version: 3,
    scan_type: 'super_health_v2',
    global_risk_score: readNumber(raw.global_risk_score),
    urgency_flag: Boolean(raw.urgency_flag),
    summary_key: normalizeSummaryKey(explicitSummaryKey ?? summaryText),
    detected_conditions: detectedConditions,
    disclaimer_key: normalizeDisclaimerKey(explicitDisclaimerKey ?? disclaimerText),
  };
}

function assertExpectedScanType(
  analysisResult: AnalysisResult | SuperScanResult,
  expectedScanType?: ScanType | null
) {
  if (!expectedScanType) {
    return;
  }

  const expectedAnalysisType = EXPECTED_ANALYSIS_TYPES[expectedScanType];
  if (expectedAnalysisType && analysisResult.scan_type !== expectedAnalysisType) {
    throw new Error(
      `Normalized analysis type mismatch: expected ${expectedAnalysisType}, received ${analysisResult.scan_type}`
    );
  }
}

export function isNormalizedAnalysisResult(
  value: unknown
): value is AnalysisResult | SuperScanResult {
  if (
    !isPlainObject(value) ||
    ![2, 3].includes(Number(value.schema_version)) ||
    !readString(value.scan_type)
  ) {
    return false;
  }

  switch (value.scan_type) {
    case 'face':
      return !!readString(value.face_shape_key);
    case 'body':
      return !!readString(value.body_type_key) && !!readString(value.muscle_mass_key);
    case 'nutrition':
      return !!readString(value.verdict_key) && !!readString(value.glycemic_index_key);
    case 'super_health_v2':
      return !!readString(value.summary_key) && !!readString(value.disclaimer_key);
    default:
      return false;
  }
}

export function normalizeAnalysisResult(
  raw: StoredAnalysisResult,
  options: NormalizeAnalysisOptions = {}
): AnalysisResult | SuperScanResult {
  if (!isPlainObject(raw)) {
    throw new Error('Analysis payload must be an object');
  }

  let normalizedResult: AnalysisResult | SuperScanResult;
  switch (raw.scan_type) {
    case 'face':
      normalizedResult = normalizeFaceResult(raw);
      break;
    case 'body':
      normalizedResult = normalizeBodyResult(raw);
      break;
    case 'nutrition':
      normalizedResult = normalizeNutritionResult(raw);
      break;
    case 'super_health_v2':
      normalizedResult = normalizeSuperScanResult(raw);
      break;
    default:
      throw new Error(
        `Unsupported analysis scan type: ${String((raw as Record<string, unknown>).scan_type)}`
      );
  }

  assertExpectedScanType(normalizedResult, options.expectedScanType);
  return normalizedResult;
}

export function tryNormalizeAnalysisResult(
  raw: unknown,
  options: NormalizeAnalysisOptions = {}
) {
  try {
    return normalizeAnalysisResult(raw as StoredAnalysisResult, options);
  } catch {
    return null;
  }
}
