import { useQuery, useQueries } from '@tanstack/react-query';
import { ApiError, ApiService, isConnectivityApiError } from '@/services/api';
import { ScanType, ScanEligibilityResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { SCAN_ELIGIBILITY_QUERY_KEY } from '@/utils/scanEligibilityQuery';

export { SCAN_ELIGIBILITY_QUERY_KEY };

const SCAN_TYPES: ScanType[] = ['body', 'health', 'nutrition', 'super'];

export type ScanEligibilityDataMap = Partial<
  Record<ScanType, ScanEligibilityResponse>
>;
export type ScanEligibilityErrorMap = Partial<Record<ScanType, ApiError>>;
export type ScanEligibilityLoadingMap = Record<ScanType, boolean>;

function buildEmptyLoadingMap(value: boolean): ScanEligibilityLoadingMap {
  return {
    body: value,
    health: value,
    nutrition: value,
    super: value,
  };
}

export const useScanEligibility = (scanType: ScanType) => {
  const { session, loading } = useAuth();
  const userId = session?.user?.id ?? null;
  const canQuery = !loading && !!session;

  return useQuery<ScanEligibilityResponse, ApiError>({
    queryKey: SCAN_ELIGIBILITY_QUERY_KEY(userId, scanType),
    queryFn: () => ApiService.checkScanEligibilityOnly(scanType),
    staleTime: 1000 * 60 * 2, // 2 minutes - les limites de scan changent plus souvent
    enabled: canQuery,
  });
};

// Hook pour récupérer l'éligibilité de tous les types de scan en parallèle
export const useAllScanEligibility = () => {
  const { session, loading } = useAuth();
  const userId = session?.user?.id ?? null;
  const canQuery = !loading && !!session;

  const queries = useQueries({
    queries: SCAN_TYPES.map((scanType) => ({
      queryKey: SCAN_ELIGIBILITY_QUERY_KEY(userId, scanType),
      queryFn: () => ApiService.checkScanEligibilityOnly(scanType),
      staleTime: 1000 * 60 * 2,
      enabled: canQuery,
      retry: false,
    })),
  });

  const data = SCAN_TYPES.reduce((acc, scanType, index) => {
    const queryData = queries[index].data;
    if (queryData) {
      acc[scanType] = queryData as ScanEligibilityResponse;
    }
    return acc;
  }, {} as ScanEligibilityDataMap);

  const errors = SCAN_TYPES.reduce((acc, scanType, index) => {
    const queryError = queries[index].error;
    if (queryError instanceof ApiError) {
      acc[scanType] = queryError;
    } else if (queryError instanceof Error) {
      acc[scanType] = new ApiError(
        queryError.message,
        'UNKNOWN',
        queryError,
        {
          scanType,
          stage: 'eligibility',
        },
      );
    }
    return acc;
  }, {} as ScanEligibilityErrorMap);

  const loadingByScanType = loading
    ? buildEmptyLoadingMap(true)
    : SCAN_TYPES.reduce((acc, scanType, index) => {
        acc[scanType] = canQuery && Boolean(queries[index].isLoading);
        return acc;
      }, buildEmptyLoadingMap(false));

  const errorList = Object.values(errors);
  const hasConnectivityError = errorList.some((error) =>
    isConnectivityApiError(error),
  );
  const hasBlockingEligibilityError = errorList.some(
    (error) => !isConnectivityApiError(error),
  );

  const refetchAll = async () => {
    if (!canQuery) {
      return [];
    }

    return Promise.all(queries.map((query) => query.refetch()));
  };

  return {
    data,
    errors,
    loadingByScanType,
    isAuthReady: !loading,
    canQuery,
    isLoading: loading || (canQuery && queries.some((query) => query.isLoading)),
    isError: errorList.length > 0,
    hasConnectivityError,
    hasBlockingEligibilityError,
    refetchAll,
  };
};
