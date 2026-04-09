export const COACH_PERSONA_KEYS = [
  'gentle_supportive',
  'strict_tough',
  'motivational_energetic',
  'patient_calm',
  'analytical_precise',
  'playful_light',
] as const;

export type CoachPersonaKey = (typeof COACH_PERSONA_KEYS)[number];

export interface CoachPersonaDefinition {
  key: CoachPersonaKey;
  requiresPremium: boolean;
  titleTranslationKey: `coach.personas.${CoachPersonaKey}.title`;
  subtitleTranslationKey: `coach.personas.${CoachPersonaKey}.subtitle`;
  toneInstructions: string;
}

export const DEFAULT_COACH_PERSONA_KEY: CoachPersonaKey = 'gentle_supportive';

export const COACH_PERSONAS: readonly CoachPersonaDefinition[] = [
  {
    key: 'gentle_supportive',
    requiresPremium: false,
    titleTranslationKey: 'coach.personas.gentle_supportive.title',
    subtitleTranslationKey: 'coach.personas.gentle_supportive.subtitle',
    toneInstructions:
      'Use a gentle, supportive, reassuring wellness coaching tone. Be warm, practical, encouraging, and non-judgmental. Keep guidance calm, clear, and easy to follow.',
  },
  {
    key: 'strict_tough',
    requiresPremium: true,
    titleTranslationKey: 'coach.personas.strict_tough.title',
    subtitleTranslationKey: 'coach.personas.strict_tough.subtitle',
    toneInstructions:
      'Use a strict, tough-love coaching tone. Be direct, disciplined, and accountability-focused without being insulting or unsafe. Push for consistency and decisive next steps.',
  },
  {
    key: 'motivational_energetic',
    requiresPremium: true,
    titleTranslationKey: 'coach.personas.motivational_energetic.title',
    subtitleTranslationKey: 'coach.personas.motivational_energetic.subtitle',
    toneInstructions:
      'Use a motivational, energetic coaching tone. Sound upbeat, momentum-building, and action-oriented. Highlight wins, reinforce confidence, and keep the advice dynamic and concise.',
  },
  {
    key: 'patient_calm',
    requiresPremium: true,
    titleTranslationKey: 'coach.personas.patient_calm.title',
    subtitleTranslationKey: 'coach.personas.patient_calm.subtitle',
    toneInstructions:
      'Use a patient, calm coaching tone. Speak with steadiness, empathy, and low pressure. Break guidance into manageable steps and normalize gradual progress.',
  },
  {
    key: 'analytical_precise',
    requiresPremium: true,
    titleTranslationKey: 'coach.personas.analytical_precise.title',
    subtitleTranslationKey: 'coach.personas.analytical_precise.subtitle',
    toneInstructions:
      'Use an analytical, precise coaching tone. Prioritize clarity, structure, and evidence-minded reasoning. Explain recommendations in a crisp, methodical way without sounding clinical.',
  },
  {
    key: 'playful_light',
    requiresPremium: true,
    titleTranslationKey: 'coach.personas.playful_light.title',
    subtitleTranslationKey: 'coach.personas.playful_light.subtitle',
    toneInstructions:
      'Use a playful, light coaching tone. Stay witty, friendly, and breezy while remaining useful and respectful. Keep the advice optimistic and easy to act on.',
  },
] as const;

const COACH_PERSONAS_BY_KEY: Record<CoachPersonaKey, CoachPersonaDefinition> =
  COACH_PERSONAS.reduce(
    (accumulator, persona) => {
      accumulator[persona.key] = persona;
      return accumulator;
    },
    {} as Record<CoachPersonaKey, CoachPersonaDefinition>,
  );

export function isCoachPersonaKey(value: unknown): value is CoachPersonaKey {
  return (
    typeof value === 'string' &&
    (COACH_PERSONA_KEYS as readonly string[]).includes(value)
  );
}

export function getCoachPersona(
  personaKey: CoachPersonaKey,
): CoachPersonaDefinition {
  return COACH_PERSONAS_BY_KEY[personaKey];
}

export function hasCoachPersonaAccess(
  personaKey: CoachPersonaKey,
  accountTier?: string | null,
): boolean {
  const persona = getCoachPersona(personaKey);
  if (!persona.requiresPremium) {
    return true;
  }

  return accountTier === 'premium' || accountTier === 'admin';
}

export function resolveEffectiveCoachPersonaKey(
  personaKey: unknown,
  accountTier?: string | null,
): CoachPersonaKey {
  if (!isCoachPersonaKey(personaKey)) {
    return DEFAULT_COACH_PERSONA_KEY;
  }

  return hasCoachPersonaAccess(personaKey, accountTier)
    ? personaKey
    : DEFAULT_COACH_PERSONA_KEY;
}

export function getVisibleCoachPersonas() {
  return COACH_PERSONAS;
}
