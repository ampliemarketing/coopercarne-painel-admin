import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Thermometer,
  Truck,
  Newspaper,
  Bell,
  ShieldCheck,
  Cake,
  MessageSquare,
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   CONSTANTES DE NEGÓCIO - COOPERCARNE
   ═══════════════════════════════════════════════ */

// Taxas de Abate por Espécie e Tipo de Usuário
export const SLAUGHTER_FEES = {
  cooperado: { bovino: 85, suino: 85, cordeiro: 35, leitao: 40 },
  terceiro: { bovino: 115, suino: 105, cordeiro: 50, leitao: 60 },
} as const;

export const calculateFee = (userType: 'cooperado' | 'terceiro', animalType: string): number => {
  const fees = SLAUGHTER_FEES[userType];
  return (fees as Record<string, number>)[animalType] ?? fees.bovino;
};

// Ratios de ocupação da câmara fria (unidades equivalentes bovinas)
export const COLD_ROOM_RATIOS = { bovino: 1.0, suino: 1.5, cordeiro: 0.5, leitao: 0.3 } as const;

// Capacidade total da câmara fria em unidades bovinas equivalentes
export const COLD_ROOM_CAPACITY = 200;

import type { AdminRole } from './types';

export interface SidebarItem {
  key: string;
  icon: typeof LayoutDashboard;
  label: string;
  shortLabel: string;
  roles: AdminRole[];
  path: string;
}

// Itens do menu de navegação (sidebar/bottom nav)
export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Início', roles: ['admin', 'operador_camara'], path: '/' },
  { key: 'users', icon: Users, label: 'Cooperados & Terceiros', shortLabel: 'Cooperados', roles: ['admin', 'operador_camara'], path: '/users' },
  { key: 'birthdays', icon: Cake, label: 'Aniversariantes', shortLabel: 'Aniversários', roles: ['admin', 'operador_camara'], path: '/birthdays' },
  { key: 'slaughter', icon: CalendarDays, label: 'Agendamento de Abate', shortLabel: 'Abate', roles: ['admin', 'operador_camara'], path: '/slaughter' },
  { key: 'coldroom', icon: Thermometer, label: 'Câmara Fria', shortLabel: 'Câmara', roles: ['admin', 'operador_camara'], path: '/coldroom' },
  { key: 'delivery', icon: Truck, label: 'Entrega & Miúdos', shortLabel: 'Entregas', roles: ['admin', 'operador_camara'], path: '/delivery' },
  { key: 'push', icon: Bell, label: 'Central Push', shortLabel: 'Push', roles: ['admin', 'operador_camara'], path: '/push' },
  { key: 'chamados', icon: MessageSquare, label: 'Central de Chamados', shortLabel: 'Chamados', roles: ['admin', 'operador_camara'], path: '/chamados' },
  { key: 'news', icon: Newspaper, label: 'Notícias & Cotações', shortLabel: 'Notícias', roles: ['admin', 'operador_camara'], path: '/news' },
  { key: 'audit', icon: ShieldCheck, label: 'Auditoria & RBAC', shortLabel: 'Auditoria', roles: ['admin'], path: '/audit' },
] as const;

export type TabKey = (typeof SIDEBAR_ITEMS)[number]['key'];
