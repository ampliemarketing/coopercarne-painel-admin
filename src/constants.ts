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
  ClipboardCheck,
  UserCog,
  FileCheck2,
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

// Ratios de ocupação da câmara fria (unidades equivalentes bovinas) — usado apenas
// para o cálculo histórico de "coldRoomUnits" exibido em relatórios de agendamento.
export const COLD_ROOM_RATIOS = { bovino: 1.0, suino: 1.5, cordeiro: 0.5, leitao: 0.3 } as const;

/**
 * Peças de carcaça geradas por cabeça abatida, por espécie.
 * Bovino: a carcaça é dividida em 2 meias-carcaças, cada uma com 1 dianteiro
 * e 1 traseiro → 2 dianteiros + 2 traseiros por cabeça.
 * Suíno e Cordeiro: divididos em apenas 1 dianteiro + 1 traseiro por cabeça.
 * Leitão não é dividido em partes — segue controlado por cabeça (unidade).
 */
export const CARCASS_PARTS_PER_HEAD = {
  bovino: { dianteiro: 2, traseiro: 2 },
  suino: { dianteiro: 1, traseiro: 1 },
  cordeiro: { dianteiro: 1, traseiro: 1 },
} as const;

// Prazo máximo (em dias) que uma peça pode permanecer na câmara fria após o abate,
// conforme exigência da vigilância sanitária. Usado para calcular a validade de cada lote.
export const COLD_ROOM_MAX_DIAS_VALIDADE = 6;

/**
 * Capacidade máxima da câmara fria por tipo de peça/cabeça.
 * Valores provisórios — ajustar conforme a capacidade real informada pelo usuário.
 */
export const COLD_ROOM_PART_CAPACITY = {
  bovinoDianteiro: 100,
  bovinoTraseiro: 100,
  suinoDianteiro: 60,
  suinoTraseiro: 60,
  cordeiroDianteiro: 20,
  cordeiroTraseiro: 20,
  leitao: 20,
} as const;

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
  { key: 'slaughter', icon: CalendarDays, label: 'Agenda de Abate', shortLabel: 'Agenda', roles: ['admin', 'operador_camara'], path: '/slaughter' },
  { key: 'abates', icon: ClipboardCheck, label: 'Abates', shortLabel: 'Abates', roles: ['admin', 'operador_camara'], path: '/abates' },
  { key: 'romaneios', icon: FileCheck2, label: 'Romaneios', shortLabel: 'Romaneios', roles: ['admin', 'operador_camara'], path: '/romaneios' },
  { key: 'coldroom', icon: Thermometer, label: 'Câmara Fria', shortLabel: 'Câmara', roles: ['admin', 'operador_camara'], path: '/coldroom' },
  { key: 'delivery', icon: Truck, label: 'Entrega', shortLabel: 'Entregas', roles: ['admin', 'operador_camara'], path: '/delivery' },
  { key: 'push', icon: Bell, label: 'Central Push', shortLabel: 'Push', roles: ['admin', 'operador_camara'], path: '/push' },
  { key: 'chamados', icon: MessageSquare, label: 'Central de Chamados', shortLabel: 'Chamados', roles: ['admin', 'operador_camara'], path: '/chamados' },
  { key: 'news', icon: Newspaper, label: 'Notícias & Cotações', shortLabel: 'Notícias', roles: ['admin', 'operador_camara'], path: '/news' },
  { key: 'system-users', icon: UserCog, label: 'Usuários do Sistema', shortLabel: 'Usuários', roles: ['admin'], path: '/usuarios-sistema' },
  { key: 'audit', icon: ShieldCheck, label: 'Auditoria & RBAC', shortLabel: 'Auditoria', roles: ['admin'], path: '/audit' },
] as const;

export type TabKey = (typeof SIDEBAR_ITEMS)[number]['key'];
