import { useMutation, useQueryClient } from '@tanstack/react-query';

import { COACH_ENTRIES_QUERY_KEY } from './useCoachEntries';
import { GROWTH_EXPERIENCE_QUERY_KEY } from './useGrowthExperience';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoachServiceError, generateCoachGuidance } from '@/services/coach';
import type {
  CoachGuidanceResult,
  CoachPersonaKey,
  CoachPromptType,
} from '@/types';

interface GenerateCoachGuidanceInput {
  promptType: CoachPromptType;
  personaKey: CoachPersonaKey;
  forceRefresh?: boolean;
}

export function useCoachGeneration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { locale } = useLanguage();

  return useMutation<
    CoachGuidanceResult,
    CoachServiceError,
    GenerateCoachGuidanceInput
  >({
    mutationFn: ({ promptType, personaKey, forceRefresh }) =>
      generateCoachGuidance({
        promptType,
        personaKey,
        forceRefresh,
        locale,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COACH_ENTRIES_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: GROWTH_EXPERIENCE_QUERY_KEY(user?.id),
      });
    },
  });
}
