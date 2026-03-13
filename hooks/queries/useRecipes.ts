import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/services/api';

export const RECIPES_QUERY_KEY = ['recipes'] as const;

export const useRecipes = () => {
  return useQuery({
    queryKey: RECIPES_QUERY_KEY,
    queryFn: ApiService.getRecipes,
  });
};
