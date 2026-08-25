import { supabase, isSupabaseReady } from '../lib/supabase';
import type { AuditLog, AdminRole } from '../types';

export const auditService = {
  /**
   * Busca os registros reais da trilha de auditoria (audit_log)
   */
  async getAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    if (!isSupabaseReady()) return [];

    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          id,
          user_id,
          acao,
          tabela,
          registro_id,
          dados_anteriores,
          dados_novos,
          ip_address,
          created_at,
          profiles (
            nome,
            email,
            perfil
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) {
        console.error('[auditService] Erro ao buscar audit_log:', error.message);
        throw error;
      }

      const rows = data || [];
      return rows.map((row: any) => {
        const prof = row.profiles;
        const userEmail = prof?.email || 'admin@coopercarne.com.br';
        const role: AdminRole = (prof?.perfil === 'operador_camara' ? 'operador_camara' : 'admin');

        let category: AuditLog['category'] = 'SISTEMA';
        if (row.tabela === 'agendamentos_abate' || row.acao.includes('ABATE') || row.acao.includes('CURRAL')) {
          category = 'OPERACIONAL';
        } else if (row.tabela === 'profiles' || row.acao.includes('USUARIO') || row.acao.includes('STATUS')) {
          category = 'USUARIOS';
        } else if (row.tabela === 'capacidade_diaria_abate' || row.acao.includes('CAMARA')) {
          category = 'CAMARA_FRIA';
        }

        const dateObj = new Date(row.created_at);
        const formattedTimestamp = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleString('pt-BR')
          : 'Hoje';

        // Detalhes amigáveis
        let detailsStr = `${row.acao} na tabela ${row.tabela}`;
        if (row.dados_novos) {
          const keys = Object.keys(row.dados_novos);
          const parts = keys.map((k) => `${k}: ${JSON.stringify(row.dados_novos[k])}`).slice(0, 3);
          detailsStr += ` (${parts.join(', ')})`;
        }

        return {
          id: row.id,
          timestamp: formattedTimestamp,
          userRole: role,
          userEmail,
          action: row.acao.replace(/_/g, ' '),
          details: detailsStr,
          category,
        };
      });
    } catch (err) {
      console.error('[auditService] Erro getAuditLogs:', err);
      return [];
    }
  },
};
