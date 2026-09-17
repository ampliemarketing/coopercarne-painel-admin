import { useQuery } from '@tanstack/react-query';
import { coldRoomService, type CamaraFriaMovimento } from '../services/coldRoomService';

export const MOVIMENTOS_QUERY_KEY = ['camara_fria_movimentos'] as const;

export function useCamaraFriaMovimentosQuery() {
  return useQuery<CamaraFriaMovimento[], Error>({
    queryKey: MOVIMENTOS_QUERY_KEY,
    queryFn: () => coldRoomService.getMovimentos(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}
