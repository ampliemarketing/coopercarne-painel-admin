import type { SlaughterSchedule } from '../types';
import { COLD_ROOM_CAPACITY, COLD_ROOM_RATIOS } from '../constants';

export interface ColdRoomOverview {
  totalCapacity: number;
  totalOccupiedUnits: number;
  remainingUnits: number;
  occupancyPercentage: number;
  isOverCapacity: boolean;
  bySpecies: {
    bovino: { count: number; units: number; capacity: number; percentage: number };
    suino: { count: number; units: number; capacity: number; percentage: number };
    cordeiro: { count: number; units: number; capacity: number; percentage: number };
    leitao: { count: number; units: number; capacity: number; percentage: number };
  };
}

export const coldRoomService = {
  /**
   * Calcula o balanço consolidado de ocupação da câmara fria a partir dos agendamentos
   */
  calculateOverview(schedules: SlaughterSchedule[]): ColdRoomOverview {
    // Considera os agendamentos confirmados no curral ou em escala ativa
    const activeConfirmed = schedules.filter(
      (s) => s.arrivalConfirmed || s.status === 'concluido' || s.status === 'aprovado'
    );

    const counts = { bovino: 0, suino: 0, cordeiro: 0, leitao: 0 };
    const units = { bovino: 0, suino: 0, cordeiro: 0, leitao: 0 };

    activeConfirmed.forEach((s) => {
      const sp = s.animalType as keyof typeof counts;
      const qty = s.confirmedQuantity || s.quantity;
      if (counts[sp] !== undefined) {
        counts[sp] += qty;
        units[sp] += qty * (COLD_ROOM_RATIOS[sp] || 1.0);
      }
    });

    const totalOccupiedUnits = units.bovino + units.suino + units.cordeiro + units.leitao;
    const remainingUnits = Math.max(0, COLD_ROOM_CAPACITY - totalOccupiedUnits);
    const occupancyPercentage = Number(((totalOccupiedUnits / COLD_ROOM_CAPACITY) * 100).toFixed(1));

    return {
      totalCapacity: COLD_ROOM_CAPACITY,
      totalOccupiedUnits: Number(totalOccupiedUnits.toFixed(1)),
      remainingUnits: Number(remainingUnits.toFixed(1)),
      occupancyPercentage,
      isOverCapacity: totalOccupiedUnits > COLD_ROOM_CAPACITY,
      bySpecies: {
        bovino: {
          count: counts.bovino,
          units: Number(units.bovino.toFixed(1)),
          capacity: 100,
          percentage: Number(((units.bovino / 100) * 100).toFixed(0)),
        },
        suino: {
          count: counts.suino,
          units: Number(units.suino.toFixed(1)),
          capacity: 80,
          percentage: Number(((units.suino / 80) * 100).toFixed(0)),
        },
        cordeiro: {
          count: counts.cordeiro,
          units: Number(units.cordeiro.toFixed(1)),
          capacity: 30,
          percentage: Number(((units.cordeiro / 30) * 100).toFixed(0)),
        },
        leitao: {
          count: counts.leitao,
          units: Number(units.leitao.toFixed(1)),
          capacity: 20,
          percentage: Number(((units.leitao / 20) * 100).toFixed(0)),
        },
      },
    };
  },
};
