import { useQuery } from '@tanstack/react-query';

import { CoachServiceError, fetchCoachEntries } from '@/services/coach';
import type { CoachEntry } from '@/types';

export const COACH_ENTRIES_QUERY_KEY = ['coachEntries'] as const;

export const useCoachEntries = () => {
  return useQuery<CoachEntry[], CoachServiceError>({
    queryKey: COACH_ENTRIES_QUERY_KEY,
    queryFn: () => fetchCoachEntries(),
    initialData: [],
    staleTime: 1000 * 60,
  });
};
