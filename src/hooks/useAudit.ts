import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import type { AuditLog } from '../types';

export const AUDIT_QUERY_KEY = ['audit_logs'] as const;

export function useAuditLogsQuery(limitCount: number = 100) {
  return useQuery<AuditLog[], Error>({
    queryKey: [...AUDIT_QUERY_KEY, limitCount],
    queryFn: () => auditService.getAuditLogs(limitCount),
    staleTime: 1000 * 30, // 30 segundos
    refetchOnWindowFocus: true,
  });
}
