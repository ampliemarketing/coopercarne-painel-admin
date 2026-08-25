import { useAppContext } from '../store/AppContext';
import type { AuditLog } from '../types';

export function useAuditLog() {
  const { state, dispatch } = useAppContext();

  const logAction = (action: string, details: string, category: AuditLog['category']) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      userRole: state.currentRole,
      userEmail: state.currentRole === 'admin' ? 'admin@coopercarne.com.br' : 'camara@coopercarne.com.br',
      action,
      details,
      category,
    };
    dispatch({ type: 'ADD_AUDIT_LOG', payload: newLog });
  };

  return { logAction };
}
