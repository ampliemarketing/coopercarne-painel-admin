export type AdminRole = 'admin' | 'operador_camara';

export interface User {
  id: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  email: string;
  type: 'cooperado' | 'terceiro';
  status: 'active' | 'blocked';
  slaughterLimit: number; // Limitação de abate específica individual
  birthDate?: string; // Data de Aniversário (YYYY-MM-DD ou DD/MM)
  notes?: string;
  createdAt: string;
}

export interface SlaughterSchedule {
  id: string;
  userId: string;
  userName: string;
  userType: 'cooperado' | 'terceiro';
  animalType: 'bovino' | 'suino' | 'cordeiro' | 'leitao';
  quantity: number;
  scheduledDate: string; // Data do agendamento
  slaughterDate: string; // Data do abate
  arrivalConfirmed: boolean;
  arrivalConfirmedAt?: string;
  confirmedQuantity?: number; // Quantidade de cabeças que efetivamente chegaram ao curral
  arrivalNotes?: string;
  noShowAlert: boolean; // Notificação de agendar e não trazer animal
  slaughterFee: number; // Calculado de acordo com o tipo e se é cooperado/terceiro
  totalFee: number;

  coldRoomUnits: number; // Espaço na câmara fria (suíno = 1.5 de bovino)
  brandMark?: string; // Marca gráfica do produtor (ex: AB, JV, C, ML)
  status?: 'pendente_aprovacao' | 'aprovado' | 'rejeitado' | 'concluido'; // Status para aprovação de terceiros
  gtaNumber?: string; // Número da Guia de Trânsito Animal
  gtaSeries?: string;
  gtaValidUntil?: string;
  gtaApproved?: boolean;
}

export interface DeliverySchedule {
  id: string;
  userId: string;
  userName: string;
  deliveryDate: string;
  carcassDelivered: boolean;
  heartDelivered: boolean;
  liverDelivered: boolean;
  notes: string;
  status: 'agendado' | 'concluido' | 'cancelado';
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Comunicado' | 'Preço' | 'Evento' | 'Informativo';
  targetAudience: 'todos' | 'cooperados' | 'terceiros';
  date: string;
  published: boolean;
  imageUrl?: string;
}

export interface ColdRoomStats {
  totalCapacityBovineUnits: number;
  occupiedBovineUnits: number;
  availableBovineUnits: number;
  bovineCount: number;
  swineCount: number;
  lambCount: number;
  pigletCount: number;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'todos' | 'cooperados' | 'terceiros';
  sentAt: string;
  sentBy: string;
  deliveredCount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: AdminRole;
  userEmail: string;
  action: string;
  details: string;
  category: 'OPERACIONAL' | 'USUARIOS' | 'CAMARA_FRIA' | 'SISTEMA';
}

export interface TicketAttachment {
  id: string;
  chamadoId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface TicketMessage {
  id: string;
  sender: 'admin' | 'cooperado' | 'terceiro';
  senderName?: string;
  text: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface Ticket {
  id: string;
  code: string;
  userId: string;
  userName: string;
  userType: 'cooperado' | 'terceiro';
  subject: string;
  description?: string;
  category: string;
  status: 'aberto' | 'em_atendimento' | 'resolvido';
  priority: 'baixa' | 'media' | 'alta';
  updatedAt: string;
  createdAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
}

export type OrderStatus =
  | 'rascunho'
  | 'enviado'
  | 'em_analise'
  | 'em_producao'
  | 'pronto_retirada'
  | 'em_transito'
  | 'entregue'
  | 'cancelado';

export type CutCategory = 'carcaca' | 'quarto' | 'miudos';

export const STANDARD_CUT_CATEGORIES = {
  carcaca: ['Carcaça Inteira', 'Meia Carcaça (Banda)'],
  quarto: ['Quarto Dianteiro', 'Quarto Traseiro', 'Ponta de Agulha (Costelar)'],
  miudos: ['Coração', 'Fígado', 'Língua', 'Rins', 'Bucho / Rúmen'],
} as const;

export interface OrderItem {
  id: string;
  category: CutCategory; // 'carcaca' | 'quarto' | 'miudos'
  cutName: string; // ex: Quarto Traseiro, Quarto Dianteiro, Meia Carcaça, Fígado, etc.
  piecesCount?: number; // Quantidade de peças/unidades (ex: 2 quartos, 1 carcaça)
  quantityKg: number; // Peso total em kg
  notes?: string; // Especificação (ex: Resfriado, Embalado, Identificação Lote)
}

export interface Order {
  id: string;
  code: string; // ex: PED-5042
  userId: string;
  userName: string;
  establishmentName?: string;
  userType?: 'cooperado' | 'terceiro';
  phone?: string;
  email?: string;
  status: OrderStatus;
  meatType: string; // bovina, suina, ovina, caprina
  itemsCount: number;
  items: OrderItem[];
  totalWeightKg: number; // Peso total em kg
  totalPieces?: number; // Total de peças/quartos/carcaças
  deliveryLocation: string;
  desiredDeliveryDate?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}



