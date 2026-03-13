// Test that all exports are available from the index file
import {
  useDashboard,
  DASHBOARD_QUERY_KEY,
  useAnalytics,
  ANALYTICS_QUERY_KEY,
  useRecipes,
  RECIPES_QUERY_KEY,
  useExercises,
  EXERCISES_QUERY_KEY,
  useScanEligibility,
  useAllScanEligibility,
  SCAN_ELIGIBILITY_QUERY_KEY,
  useNotificationsQuery,
  NOTIFICATIONS_QUERY_KEY,
  usePremiumFeatures,
  PREMIUM_FEATURES_QUERY_KEY,
} from '@/hooks/queries';

describe('hooks/queries/index', () => {
  it('exports useDashboard hook', () => {
    expect(useDashboard).toBeDefined();
    expect(typeof useDashboard).toBe('function');
  });

  it('exports DASHBOARD_QUERY_KEY', () => {
    expect(DASHBOARD_QUERY_KEY).toBeDefined();
    expect(DASHBOARD_QUERY_KEY).toEqual(['dashboard']);
  });

  it('exports useAnalytics hook', () => {
    expect(useAnalytics).toBeDefined();
    expect(typeof useAnalytics).toBe('function');
  });

  it('exports ANALYTICS_QUERY_KEY', () => {
    expect(ANALYTICS_QUERY_KEY).toBeDefined();
    expect(typeof ANALYTICS_QUERY_KEY).toBe('function');
  });

  it('exports useRecipes hook', () => {
    expect(useRecipes).toBeDefined();
    expect(typeof useRecipes).toBe('function');
  });

  it('exports RECIPES_QUERY_KEY', () => {
    expect(RECIPES_QUERY_KEY).toBeDefined();
    expect(RECIPES_QUERY_KEY).toEqual(['recipes']);
  });

  it('exports useExercises hook', () => {
    expect(useExercises).toBeDefined();
    expect(typeof useExercises).toBe('function');
  });

  it('exports EXERCISES_QUERY_KEY', () => {
    expect(EXERCISES_QUERY_KEY).toBeDefined();
    expect(EXERCISES_QUERY_KEY).toEqual(['exercises']);
  });

  it('exports useScanEligibility hook', () => {
    expect(useScanEligibility).toBeDefined();
    expect(typeof useScanEligibility).toBe('function');
  });

  it('exports useAllScanEligibility hook', () => {
    expect(useAllScanEligibility).toBeDefined();
    expect(typeof useAllScanEligibility).toBe('function');
  });

  it('exports SCAN_ELIGIBILITY_QUERY_KEY', () => {
    expect(SCAN_ELIGIBILITY_QUERY_KEY).toBeDefined();
    expect(typeof SCAN_ELIGIBILITY_QUERY_KEY).toBe('function');
  });

  it('exports useNotificationsQuery hook', () => {
    expect(useNotificationsQuery).toBeDefined();
    expect(typeof useNotificationsQuery).toBe('function');
  });

  it('exports NOTIFICATIONS_QUERY_KEY', () => {
    expect(NOTIFICATIONS_QUERY_KEY).toBeDefined();
    expect(typeof NOTIFICATIONS_QUERY_KEY).toBe('function');
  });

  it('exports usePremiumFeatures hook', () => {
    expect(usePremiumFeatures).toBeDefined();
    expect(typeof usePremiumFeatures).toBe('function');
  });

  it('exports PREMIUM_FEATURES_QUERY_KEY', () => {
    expect(PREMIUM_FEATURES_QUERY_KEY).toBeDefined();
    expect(PREMIUM_FEATURES_QUERY_KEY).toEqual(['premiumFeatures']);
  });
});
