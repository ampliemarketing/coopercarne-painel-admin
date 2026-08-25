import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  INITIAL_USERS,
  INITIAL_SCHEDULES,
  INITIAL_DELIVERIES,
  INITIAL_NEWS,
  INITIAL_PUSH_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../mockData';
import type {
  User,
  SlaughterSchedule,
  DeliverySchedule,
  NewsItem,
  PushNotification,
  AuditLog,
  AdminRole,
} from '../types';

/* ═══════════════════════════════════════════════
   TIPOS DO ESTADO GLOBAL
   ═══════════════════════════════════════════════ */

interface DailyQuote {
  id: string;
  name: string;
  price: number;
  variation: number;
  unit: string;
  category: string;
}

interface TicketMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface Ticket {
  id: string;
  userName: string;
  userType: string;
  subject: string;
  status: 'aberto' | 'em_atendimento' | 'resolvido';
  priority: 'baixa' | 'media' | 'alta';
  updatedAt: string;
  messages: TicketMessage[];
}

export interface AppState {
  currentRole: AdminRole;
  users: User[];
  schedules: SlaughterSchedule[];
  deliveries: DeliverySchedule[];
  news: NewsItem[];
  pushNotifications: PushNotification[];
  auditLogs: AuditLog[];
  dailyQuotes: DailyQuote[];
  tickets: Ticket[];
}

/* ═══════════════════════════════════════════════
   ACTIONS
   ═══════════════════════════════════════════════ */

type Action =
  | { type: 'SET_ROLE'; payload: AdminRole }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<User> } }
  | { type: 'SET_SCHEDULES'; payload: SlaughterSchedule[] }
  | { type: 'ADD_SCHEDULE'; payload: SlaughterSchedule }
  | { type: 'UPDATE_SCHEDULE'; payload: { id: string; updates: Partial<SlaughterSchedule> } }
  | { type: 'SET_DELIVERIES'; payload: DeliverySchedule[] }
  | { type: 'UPDATE_DELIVERY'; payload: { id: string; updates: Partial<DeliverySchedule> } }
  | { type: 'SET_NEWS'; payload: NewsItem[] }
  | { type: 'ADD_NEWS'; payload: NewsItem }
  | { type: 'SET_PUSH_NOTIFICATIONS'; payload: PushNotification[] }
  | { type: 'ADD_PUSH_NOTIFICATION'; payload: PushNotification }
  | { type: 'SET_AUDIT_LOGS'; payload: AuditLog[] }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditLog }
  | { type: 'SET_DAILY_QUOTES'; payload: DailyQuote[] }
  | { type: 'UPDATE_QUOTE'; payload: { id: string; price: number; variation: number } }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'UPDATE_TICKET'; payload: { id: string; updates: Partial<Ticket> } }
  | { type: 'ADD_TICKET_MESSAGE'; payload: { ticketId: string; message: TicketMessage } };

/* ═══════════════════════════════════════════════
   ESTADO INICIAL
   ═══════════════════════════════════════════════ */

const initialState: AppState = {
  currentRole: 'admin',
  users: INITIAL_USERS,
  schedules: INITIAL_SCHEDULES,
  deliveries: INITIAL_DELIVERIES,
  news: INITIAL_NEWS,
  pushNotifications: INITIAL_PUSH_NOTIFICATIONS,
  auditLogs: INITIAL_AUDIT_LOGS,
  dailyQuotes: [
    { id: 'q1', name: 'Bovino Gordo (@)', price: 325.00, variation: 2.5, unit: '@', category: 'Animais' },
    { id: 'q2', name: 'Suíno Vivo (kg)', price: 8.50, variation: -1.2, unit: 'kg', category: 'Animais' },
    { id: 'q3', name: 'Ovino / Cordeiro (kg)', price: 18.00, variation: 0.0, unit: 'kg', category: 'Animais' },
    { id: 'q4', name: 'Farinha de Carne/Ossos Mista', price: 2.45, variation: 1.8, unit: 'kg', category: 'Subprodutos & Grãos' },
    { id: 'q5', name: 'Sebo Bovino (Cebo)', price: 4.80, variation: 0.5, unit: 'kg', category: 'Subprodutos & Grãos' },
    { id: 'q6', name: 'Milho (Saca 60kg)', price: 68.50, variation: -0.8, unit: 'sc', category: 'Subprodutos & Grãos' },
    { id: 'q7', name: 'Soja (Saca 60kg)', price: 134.00, variation: 1.2, unit: 'sc', category: 'Subprodutos & Grãos' },
  ],
  tickets: [
    {
      id: 'TK-1001',
      userName: 'João Silva',
      userType: 'cooperado',
      subject: 'Dúvida sobre Agendamento PED002',
      status: 'aberto',
      priority: 'alta',
      updatedAt: '29/01/2026 09:08',
      messages: [
        { id: '1', sender: 'admin', text: 'Olá! Bem-vindo à Central de Relacionamento COOPERCARNE. Como posso ajudá-lo?', timestamp: '09:00' },
        { id: '2', sender: 'user', text: 'Bom dia! Gostaria de saber sobre o status do meu pedido PED002', timestamp: '09:05' },
        { id: '3', sender: 'admin', text: 'Deixe-me verificar para você. Um momento, por favor.', timestamp: '09:06' },
        { id: '4', sender: 'admin', text: 'Seu pedido PED002 está em produção e a previsão de entrega é para amanhã. Precisa de mais alguma informação?', timestamp: '09:08' },
      ]
    },
    {
      id: 'TK-1002',
      userName: 'Frigorífico Sul',
      userType: 'terceiro',
      subject: 'Solicitação de Nota Fiscal de Serviços',
      status: 'em_atendimento',
      priority: 'media',
      updatedAt: '28/01/2026 15:30',
      messages: [
        { id: '1', sender: 'user', text: 'Boa tarde! Preciso da emissão da 2ª via da NF de abate referente à semana passada.', timestamp: '15:20' },
        { id: '2', sender: 'admin', text: 'Olá! O setor financeiro já anexou a NF no seu perfil no app. Você também pode baixar por aqui se preferir.', timestamp: '15:30' }
      ]
    },
    {
      id: 'TK-1003',
      userName: 'Carlos Oliveira',
      userType: 'cooperado',
      subject: 'Confirmação de GTA para Lote de Suínos',
      status: 'resolvido',
      priority: 'baixa',
      updatedAt: '27/01/2026 11:15',
      messages: [
        { id: '1', sender: 'user', text: 'Minha GTA já consta como aprovada no sistema?', timestamp: '10:45' },
        { id: '2', sender: 'admin', text: 'Sim, Sr. Carlos! A GTA sanitária foi validada e seu lote está confirmado na escala.', timestamp: '11:15' }
      ]
    }
  ],
};

/* ═══════════════════════════════════════════════
   REDUCER
   ═══════════════════════════════════════════════ */

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, currentRole: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload.updates } : u) };
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload };
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [action.payload, ...state.schedules] };
    case 'UPDATE_SCHEDULE':
      return { ...state, schedules: state.schedules.map(s => s.id === action.payload.id ? { ...s, ...action.payload.updates } : s) };
    case 'SET_DELIVERIES':
      return { ...state, deliveries: action.payload };
    case 'UPDATE_DELIVERY':
      return { ...state, deliveries: state.deliveries.map(d => d.id === action.payload.id ? { ...d, ...action.payload.updates } : d) };
    case 'SET_NEWS':
      return { ...state, news: action.payload };
    case 'ADD_NEWS':
      return { ...state, news: [action.payload, ...state.news] };
    case 'SET_PUSH_NOTIFICATIONS':
      return { ...state, pushNotifications: action.payload };
    case 'ADD_PUSH_NOTIFICATION':
      return { ...state, pushNotifications: [action.payload, ...state.pushNotifications] };
    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.payload };
    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [action.payload, ...state.auditLogs] };
    case 'SET_DAILY_QUOTES':
      return { ...state, dailyQuotes: action.payload };
    case 'UPDATE_QUOTE':
      return { ...state, dailyQuotes: state.dailyQuotes.map(q => q.id === action.payload.id ? { ...q, price: action.payload.price, variation: action.payload.variation } : q) };
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload };
    case 'UPDATE_TICKET':
      return { ...state, tickets: state.tickets.map(t => t.id === action.payload.id ? { ...t, ...action.payload.updates } : t) };
    case 'ADD_TICKET_MESSAGE': {
      return {
        ...state,
        tickets: state.tickets.map(t =>
          t.id === action.payload.ticketId
            ? { ...t, messages: [...t.messages, action.payload.message], updatedAt: 'Hoje ' + action.payload.message.timestamp }
            : t
        ),
      };
    }
    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════
   CONTEXT & PROVIDER
   ═══════════════════════════════════════════════ */

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export type { DailyQuote, Ticket, TicketMessage, Action };
