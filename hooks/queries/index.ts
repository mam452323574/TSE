// Hooks de queries React Query
export { useDashboard, DASHBOARD_QUERY_KEY } from './useDashboard';
export { useAnalytics, ANALYTICS_QUERY_KEY } from './useAnalytics';
export { useRecipes, RECIPES_QUERY_KEY } from './useRecipes';
export { useExercises, EXERCISES_QUERY_KEY } from './useExercises';
export { 
  useScanEligibility, 
  useAllScanEligibility, 
  SCAN_ELIGIBILITY_QUERY_KEY 
} from './useScanEligibility';
export { useNotificationsQuery, NOTIFICATIONS_QUERY_KEY, fetchNotifications } from './useNotifications';
export { usePremiumFeatures, PREMIUM_FEATURES_QUERY_KEY } from './usePremiumFeatures';
export { usePremiumPotential, PREMIUM_POTENTIAL_QUERY_KEY } from './usePremiumPotential';
export { useFeatureFlags, FEATURE_FLAGS_QUERY_KEY } from './useFeatureFlags';
export {
  useSocialFeed,
  SOCIAL_FEED_QUERY_KEY,
  flattenSocialFeedPages,
} from './useSocialFeed';
export { useSocialComments, SOCIAL_COMMENTS_QUERY_KEY } from './useSocialComments';
export { useSocialMutations } from './useSocialMutations';
export { useCoachEntries, COACH_ENTRIES_QUERY_KEY } from './useCoachEntries';
export { useGrowthExperience, GROWTH_EXPERIENCE_QUERY_KEY } from './useGrowthExperience';
export { useCoachGeneration } from './useCoachGeneration';
