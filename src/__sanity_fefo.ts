import { coldRoomService } from './services/coldRoomService';
import type { CamaraFriaMovimento } from './services/coldRoomService';
import type { SlaughterSchedule } from './types';

function baseSchedule(overrides: Partial<SlaughterSchedule>): SlaughterSchedule {
  return {
    id: overrides.id || 'x',
    userId: 'u1',
    userName: 'Fazenda Teste',
    userType: 'cooperado',
    animalType: 'bovino',
    quantity: 1,
    scheduledDate: '2026-09-01',
    slaughterDate: '2026-09-01',
    arrivalConfirmed: true,
    noShowAlert: false,
    slaughterFee: 85,
    totalFee: 85,
    coldRoomUnits: 1,
    status: 'concluido',
    ...overrides,
  };
}

console.log('=== Cenário do usuário: lote de 10 bovinos, consumo parcial em 2 etapas ===');

const loteA: SlaughterSchedule = baseSchedule({
  id: 'lote-A',
  animalType: 'bovino',
  quantity: 10,
  quantidadeProcessada: 10,
  statusOperacional: 'finalizado',
  finalizadoEm: '2026-09-10T12:00:00.000Z', // quarta
});

const loteB: SlaughterSchedule = baseSchedule({
  id: 'lote-B',
  animalType: 'bovino',
  quantity: 5,
  quantidadeProcessada: 5,
  statusOperacional: 'finalizado',
  finalizadoEm: '2026-09-12T12:00:00.000Z', // sexta (mais novo que o lote A)
});

const schedules = [loteA, loteB];

// Estado inicial: nada consumido ainda. Lote A gera 20D+20T, Lote B gera 10D+10T.
let overview = coldRoomService.calculateOverview(schedules, []);
console.log('Antes de qualquer entrega — Bovino Dianteiro esperado=30, obtido=', overview.bovino.dianteiro.occupied);
console.log('Antes de qualquer entrega — Bovino Traseiro esperado=30, obtido=', overview.bovino.traseiro.occupied);

// Entrega 1: consome 2 dianteiros + 2 traseiros. Deve sair do lote A (mais antigo).
const movimentos1: CamaraFriaMovimento[] = [
  { id: 'm1', agendamentoId: 'lote-A', tipoAnimal: 'bovino', tipoPeca: 'dianteiro', quantidade: 2, createdAt: '2026-09-11' },
  { id: 'm2', agendamentoId: 'lote-A', tipoAnimal: 'bovino', tipoPeca: 'traseiro', quantidade: 2, createdAt: '2026-09-11' },
];

overview = coldRoomService.calculateOverview(schedules, movimentos1);
console.log('\nApós entrega 1 (2D+2T do lote A) — total Dianteiro esperado=28, obtido=', overview.bovino.dianteiro.occupied);
console.log('Após entrega 1 — total Traseiro esperado=28, obtido=', overview.bovino.traseiro.occupied);

let lotes = coldRoomService.buildLotes(schedules, movimentos1);
const loteAState = lotes.find((l) => l.id === 'lote-A')!;
console.log('Saldo restante no lote A (deve continuar existindo e ser o mais antigo): dianteiro=18, traseiro=18 ->', loteAState.saldoDianteiro, loteAState.saldoTraseiro);
console.log('Ordem FEFO (mais próximo de vencer primeiro):', lotes.map((l) => l.id));

// Entrega 2 (outro dia): pede mais 8 dianteiros + 8 traseiros. Deve continuar
// descontando do MESMO lote A (que ainda tem 18+18 de saldo), não pular pro lote B.
const movimentos2: CamaraFriaMovimento[] = [
  ...movimentos1,
  { id: 'm3', agendamentoId: 'lote-A', tipoAnimal: 'bovino', tipoPeca: 'dianteiro', quantidade: 8, createdAt: '2026-09-13' },
  { id: 'm4', agendamentoId: 'lote-A', tipoAnimal: 'bovino', tipoPeca: 'traseiro', quantidade: 8, createdAt: '2026-09-13' },
];

lotes = coldRoomService.buildLotes(schedules, movimentos2);
const loteAState2 = lotes.find((l) => l.id === 'lote-A')!;
const loteBState2 = lotes.find((l) => l.id === 'lote-B')!;
console.log('\nApós entrega 2 (mais 8D+8T, ainda do lote A) — saldo lote A esperado: dianteiro=10, traseiro=10 ->', loteAState2.saldoDianteiro, loteAState2.saldoTraseiro);
console.log('Lote B não deveria ter sido tocado — saldo esperado: dianteiro=10, traseiro=10 ->', loteBState2.saldoDianteiro, loteBState2.saldoTraseiro);

overview = coldRoomService.calculateOverview(schedules, movimentos2);
console.log('Total geral em estoque — Dianteiro esperado=20 (10 do A + 10 do B), obtido=', overview.bovino.dianteiro.occupied);

// Simula esgotar o lote A totalmente e verificar que o próximo consumo cairia pro lote B
// (isso é testado indiretamente: se saldo do lote A chegasse a 0, ele sumiria da lista de lotes)
const movimentosExaustaoA: CamaraFriaMovimento[] = [
  { id: 'mx1', agendamentoId: 'lote-A', tipoAnimal: 'bovino', tipoPeca: 'dianteiro', quantidade: 20, createdAt: '2026-09-14' },
  { id: 'mx2', agendamentoId: 'lote-A', tipoAnimal: 'bovino', tipoPeca: 'traseiro', quantidade: 20, createdAt: '2026-09-14' },
];
lotes = coldRoomService.buildLotes(schedules, movimentosExaustaoA);
console.log('\nApós esgotar 100% do lote A, lotes restantes na lista (só deve sobrar o B):', lotes.map((l) => l.id));
