import { useQuery, useQueries } from '@tanstack/react-query';
import { ApiService } from '@/services/api';
import { ScanType, ScanEligibilityResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const SCAN_ELIGIBILITY_QUERY_KEY = (scanType: ScanType) => 
  ['scanEligibility', scanType] as const;

export const useScanEligibility = (scanType: ScanType) => {
  const { session } = useAuth();
  
  return useQuery<ScanEligibilityResponse, Error>({
    queryKey: SCAN_ELIGIBILITY_QUERY_KEY(scanType),
    queryFn: () => ApiService.checkScanEligibilityOnly(scanType),
    staleTime: 1000 * 60 * 2, // 2 minutes - les limites de scan changent plus souvent
    enabled: !!session,
  });
};

// Hook pour récupérer l'éligibilité de tous les types de scan en parallèle
export const useAllScanEligibility = () => {
  const { session } = useAuth();
  const scanTypes: ScanType[] = ['body', 'health', 'nutrition', 'super'];

  const queries = useQueries({
    queries: scanTypes.map((scanType) => ({
      queryKey: SCAN_ELIGIBILITY_QUERY_KEY(scanType),
      queryFn: () => ApiService.checkScanEligibilityOnly(scanType),
      staleTime: 1000 * 60 * 2,
      enabled: !!session,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const data = isLoading || isError
    ? null
    : scanTypes.reduce((acc, scanType, index) => {
        acc[scanType] = queries[index].data as ScanEligibilityResponse;
        return acc;
      }, {} as Record<ScanType, ScanEligibilityResponse>);

  const refetchAll = () => {
    queries.forEach((q) => q.refetch());
  };

  return {
    data,
    isLoading,
    isError,
    refetchAll,
  };
};
