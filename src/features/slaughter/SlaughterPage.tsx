import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  X,
  FileCheck,
  AlertTriangle,
  Truck,
  Printer,
  AlertCircle,
} from 'lucide-react';
import { exportToCSV } from '../../hooks/useExportCSV';
import { PageHeader, Badge, btnPrimary, btnSecondary } from '../../components/ui';
import { AddScheduleModal } from '../../components/modals/AddScheduleModal';
import { ConfirmArrivalModal } from '../../components/modals/ConfirmArrivalModal';
import { PrintScheduleModal } from '../../components/modals/PrintScheduleModal';
import { useSchedulesQuery, useUpdateScheduleStatusMutation } from '../../hooks/useSchedules';
import type { SlaughterSchedule } from '../../types';

export function SlaughterPage() {
  const { data: schedules = [], isLoading, isError, error, refetch, isFetching } = useSchedulesQuery();
  const updateStatusMutation = useUpdateScheduleStatusMutation();

  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [printSchedule, setPrintSchedule] = useState<SlaughterSchedule | null>(null);
  const [confirmArrivalModalSchedule, setConfirmArrivalModalSchedule] = useState<SlaughterSchedule | null>(null);

  // Calcula a segunda-feira inicial da semana atual
  const getInitialMonday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const initialMonday = getInitialMonday();

  // Filtros de Visualização e Histórico da Escala
  const [schedulePeriodMode, setSchedulePeriodMode] = useState<'dia' | 'semana' | 'mes' | 'historico'>('semana');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonday.substring(0, 7));
  const [agendaStartDate, setAgendaStartDate] = useState<string>(initialMonday);

  const getAgendaDates = (startDateStr: string) => {
    let base = new Date(startDateStr + 'T00:00:00');
    if (isNaN(base.getTime())) base = new Date(initialMonday + 'T00:00:00');
    const days = [];
    const dayNames = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    for (let i = 0; i < 6; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      days.push({
        label: `${dayNames[i]} ${dayNum}/${monthNum}`,
        shortLabel: `${dayNum}/${monthNum}`,
        fullDateStr: `${d.getFullYear()}-${monthNum}-${dayNum}`,
        dayNum,
        monthNum,
        year: d.getFullYear(),
      });
    }
    return days;
  };

  const handlePrevWeekAgenda = () => {
    let d = new Date(agendaStartDate + 'T00:00:00');
    if (isNaN(d.getTime())) d = new Date(initialMonday + 'T00:00:00');

    if (schedulePeriodMode === 'dia') {
      d.setDate(d.getDate() - 1);
    } else if (schedulePeriodMode === 'mes') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    setAgendaStartDate(newDateStr);
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  const handleNextWeekAgenda = () => {
    let d = new Date(agendaStartDate + 'T00:00:00');
    if (isNaN(d.getTime())) d = new Date(initialMonday + 'T00:00:00');

    if (schedulePeriodMode === 'dia') {
      d.setDate(d.getDate() + 1);
    } else if (schedulePeriodMode === 'mes') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    setAgendaStartDate(newDateStr);
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  const handleApproveThirdPartySchedule = (schedule: SlaughterSchedule) => {
    updateStatusMutation.mutate({
      scheduleId: schedule.id,
      newStatus: 'aprovado',
      userName: schedule.userName,
    });
  };

  const handleRejectThirdPartySchedule = (schedule: SlaughterSchedule) => {
    if (confirm(`Deseja rejeitar a solicitação de abate de "${schedule.userName}"?`)) {
      updateStatusMutation.mutate({
        scheduleId: schedule.id,
        newStatus: 'rejeitado',
        userName: schedule.userName,
      });
    }
  };

  const handleToggleNoShowAlert = (schedule: SlaughterSchedule) => {
    updateStatusMutation.mutate({
      scheduleId: schedule.id,
      newStatus: schedule.status === 'rejeitado' ? 'aprovado' : 'rejeitado',
      userName: schedule.userName,
    });
  };

  // Agregação dinâmica da Escala de Abate para a Semana Selecionada
  const currentAgendaDays = getAgendaDates(agendaStartDate);

  // 1. Matriz Semanal Dinâmica
  const weeklyMatrixData = React.useMemo(() => {
    const targetDates = currentAgendaDays.map((d) => d.fullDateStr);
    const dateSet = new Set(targetDates);

    // Filtra agendamentos da semana
    const weekSchedules = schedules.filter((s) => {
      const targetDate = s.slaughterDate || s.scheduledDate;
      return targetDate && dateSet.has(targetDate);
    });

    // Agrupa por produtor
    const producersMap = new Map<
      string,
      {
        mark: string;
        name: string;
        userType: 'cooperado' | 'terceiro';
        days: Record<string, { bov: number; sui: number; ovi: number }>;
      }
    >();

    weekSchedules.forEach((s) => {
      const pName = s.userName || 'Cooperado';
      if (!producersMap.has(pName)) {
        const words = pName.trim().split(' ');
        const mark =
          words.length >= 2
            ? `${words[0][0]}${words[1][0]}`.toUpperCase()
            : pName.substring(0, 3).toUpperCase();

        producersMap.set(pName, {
          mark,
          name: pName,
          userType: s.userType || 'cooperado',
          days: {},
        });
      }

      const prod = producersMap.get(pName)!;
      const targetDate = s.slaughterDate || s.scheduledDate;
      if (targetDate) {
        if (!prod.days[targetDate]) {
          prod.days[targetDate] = { bov: 0, sui: 0, ovi: 0 };
        }
        const aType = (s.animalType || '').toLowerCase();
        const qty = Number(s.quantity) || 0;
        if (aType.includes('sui') || aType.includes('suí')) {
          prod.days[targetDate].sui += qty;
        } else if (aType.includes('ovi') || aType.includes('cord') || aType.includes('leit')) {
          prod.days[targetDate].ovi += qty;
        } else {
          prod.days[targetDate].bov += qty;
        }
      }
    });

    // Calcula totais por dia da semana
    const dayTotals = currentAgendaDays.map((day) => {
      let bov = 0;
      let sui = 0;
      let ovi = 0;
      weekSchedules.forEach((s) => {
        const targetDate = s.slaughterDate || s.scheduledDate;
        if (targetDate === day.fullDateStr) {
          const aType = (s.animalType || '').toLowerCase();
          const qty = Number(s.quantity) || 0;
          if (aType.includes('sui') || aType.includes('suí')) sui += qty;
          else if (aType.includes('ovi') || aType.includes('cord') || aType.includes('leit')) ovi += qty;
          else bov += qty;
        }
      });
      return { bov, sui, ovi, total: bov + sui + ovi };
    });

    return {
      producers: Array.from(producersMap.values()),
      dayTotals,
      totalWeekSchedules: weekSchedules.length,
    };
  }, [schedules, agendaStartDate]);

  // 2. Matriz Diária Dinâmica
  const dailyMatrixData = React.useMemo(() => {
    const daySchedules = schedules.filter((s) => {
      const targetDate = s.slaughterDate || s.scheduledDate;
      return targetDate === agendaStartDate;
    });

    const producersMap = new Map<
      string,
      {
        mark: string;
        name: string;
        userType: 'cooperado' | 'terceiro';
        bov: number;
        sui: number;
        ovi: number;
      }
    >();

    daySchedules.forEach((s) => {
      const pName = s.userName || 'Cooperado';
      if (!producersMap.has(pName)) {
        const words = pName.trim().split(' ');
        const mark =
          words.length >= 2
            ? `${words[0][0]}${words[1][0]}`.toUpperCase()
            : pName.substring(0, 3).toUpperCase();

        producersMap.set(pName, {
          mark,
          name: pName,
          userType: s.userType || 'cooperado',
          bov: 0,
          sui: 0,
          ovi: 0,
        });
      }

      const prod = producersMap.get(pName)!;
      const aType = (s.animalType || '').toLowerCase();
      const qty = Number(s.quantity) || 0;
      if (aType.includes('sui') || aType.includes('suí')) {
        prod.sui += qty;
      } else if (aType.includes('ovi') || aType.includes('cord') || aType.includes('leit')) {
        prod.ovi += qty;
      } else {
        prod.bov += qty;
      }
    });

    return Array.from(producersMap.values());
  }, [schedules, agendaStartDate]);

  // 3. Matriz Mensal Dinâmica
  const monthlyMatrixData = React.useMemo(() => {
    const monthSchedules = schedules.filter((s) => {
      const targetDate = s.slaughterDate || s.scheduledDate;
      return targetDate && targetDate.startsWith(selectedMonth);
    });

    const producersMap = new Map<
      string,
      {
        mark: string;
        name: string;
        userType: 'cooperado' | 'terceiro';
        bov: number;
        sui: number;
        ovi: number;
      }
    >();

    monthSchedules.forEach((s) => {
      const pName = s.userName || 'Cooperado';
      if (!producersMap.has(pName)) {
        const words = pName.trim().split(' ');
        const mark =
          words.length >= 2
            ? `${words[0][0]}${words[1][0]}`.toUpperCase()
            : pName.substring(0, 3).toUpperCase();

        producersMap.set(pName, {
          mark,
          name: pName,
          userType: s.userType || 'cooperado',
          bov: 0,
          sui: 0,
          ovi: 0,
        });
      }

      const prod = producersMap.get(pName)!;
      const aType = (s.animalType || '').toLowerCase();
      const qty = Number(s.quantity) || 0;
      if (aType.includes('sui') || aType.includes('suí')) {
        prod.sui += qty;
      } else if (aType.includes('ovi') || aType.includes('cord') || aType.includes('leit')) {
        prod.ovi += qty;
      } else {
        prod.bov += qty;
      }
    });

    return Array.from(producersMap.values());
  }, [schedules, selectedMonth]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Agenda de Abate & Programação Semanal"
          description="Escala de abate por dia, mês, controle de lotes, validação de GTA e persistência no Supabase"
        />
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Sincronizar agendamentos do Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
          </button>
          <button
            onClick={() =>
              exportToCSV(
                'escala_abate_supabase',
                ['ID', 'Produtor', 'Tipo_Usuario', 'Especie', 'Quantidade', 'Data_Abate', 'Taxa_Total', 'GTA', 'Status'],
                schedules.map((s) => [
                  s.id,
                  s.userName,
                  s.userType,
                  s.animalType,
                  s.quantity,
                  s.slaughterDate,
                  s.totalFee,
                  s.gtaNumber || '',
                  s.status || '',
                ])
              )
            }
            className={btnSecondary + ' flex items-center gap-1.5 text-xs'}
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button
            onClick={() => setIsAddScheduleOpen(true)}
            className={btnPrimary + ' flex items-center gap-1.5 text-xs'}
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-md p-8 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-48 bg-slate-100 rounded" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar escala de abate</h3>
          <p className="text-xs text-red-700 mb-4">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded shadow-sm"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <>
          {/* CARD DE VISUALIZAÇÃO COMPLETA DA ESCALA DE ABATE DA SEMANA COM AGENDA INTERATIVA */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-100 text-slate-900">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-slate-600" /> PROGRAMAÇÃO SEMANAL DE ABATE
                </h3>
                <p className="text-xs text-slate-500">
                  Navegue pelas datas da agenda para consultar o consolidado de agendamentos reais
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Visualização:</span>
                  <select
                    value={schedulePeriodMode}
                    onChange={(e) => setSchedulePeriodMode(e.target.value as any)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#c51d1f] shadow-sm"
                  >
                    <option value="semana">Por Semana</option>
                    <option value="dia">Por Dia</option>
                    <option value="mes">Por Mês</option>
                  </select>
                </div>

                {/* BARRA DE NAVEGAÇÃO DE AGENDA */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-1.5 py-1 shadow-sm">
                  <button
                    onClick={handlePrevWeekAgenda}
                    className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                    title={schedulePeriodMode === 'dia' ? 'Dia Anterior' : schedulePeriodMode === 'mes' ? 'Mês Anterior' : 'Semana Anterior'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="date"
                      value={agendaStartDate}
                      onChange={(e) => {
                        setAgendaStartDate(e.target.value);
                        setSelectedMonth(e.target.value.substring(0, 7));
                      }}
                      className="text-xs font-bold text-slate-800 bg-transparent border-0 outline-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleNextWeekAgenda}
                    className="p-1 rounded hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                    title={schedulePeriodMode === 'dia' ? 'Próximo Dia' : schedulePeriodMode === 'mes' ? 'Próximo Mês' : 'Próxima Semana'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const todayMonday = getInitialMonday();
                    setAgendaStartDate(todayMonday);
                    setSelectedMonth(todayMonday.substring(0, 7));
                  }}
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-2.5 py-1.5 rounded transition-colors"
                  title="Voltar para a semana atual"
                >
                  Hoje
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                {schedulePeriodMode === 'dia' ? (
                  <>
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-300">
                        <td colSpan={2} className="px-3 py-2.5 border-r border-slate-300 text-left text-xs uppercase tracking-wider font-extrabold text-slate-900 bg-slate-200">
                          ESCALA DIÁRIA DE ABATE ({agendaStartDate}):
                        </td>
                        <td className="px-4 py-2.5 border-r border-slate-300 text-xs font-extrabold uppercase bg-blue-100/80 text-blue-950">
                          BOVINO (DIA)
                        </td>
                        <td className="px-4 py-2.5 border-r border-slate-300 text-xs font-extrabold uppercase bg-amber-100/80 text-amber-950">
                          SUÍNO (DIA)
                        </td>
                        <td className="px-4 py-2.5 text-xs font-extrabold uppercase bg-red-100/80 text-[#c51d1f]">
                          TOTAL DIA (CAB)
                        </td>
                      </tr>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-center border-b border-slate-200 text-[11px]">
                        <th className="px-3 py-2 border-r border-slate-200 text-left w-16">MARCA</th>
                        <th className="px-4 py-2 border-r border-slate-200 text-left">COOPERADO / TERCEIRO</th>
                        <th className="px-4 py-2 border-r border-slate-200 text-center text-slate-800">QTD BOVINOS</th>
                        <th className="px-4 py-2 border-r border-slate-200 text-center text-slate-800">QTD SUÍNOS</th>
                        <th className="px-4 py-2 text-center text-slate-900 font-extrabold">TOTAL CABEÇAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {dailyMatrixData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 text-xs font-medium">
                            Nenhum lote agendado para o dia {agendaStartDate}.
                          </td>
                        </tr>
                      ) : (
                        dailyMatrixData.map((row, idx) => {
                          const totalGeral = row.bov + row.sui + row.ovi;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors font-medium">
                              <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-200 text-center">{row.mark}</td>
                              <td className="px-4 py-1.5 font-semibold text-slate-800 border-r border-slate-200 text-left">
                                {row.name}
                                <span className="ml-2 text-[10px] uppercase font-bold text-slate-400">({row.userType})</span>
                              </td>
                              <td className="px-4 py-1.5 border-r border-slate-200 font-bold text-blue-700 text-center bg-blue-50/20">{row.bov || '-'}</td>
                              <td className="px-4 py-1.5 border-r border-slate-200 font-bold text-amber-700 text-center bg-amber-50/20">{row.sui || '-'}</td>
                              <td className="px-4 py-1.5 font-extrabold text-[#c51d1f] text-center bg-red-50/30 text-xs">{totalGeral || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </>
                ) : schedulePeriodMode === 'mes' ? (
                  <>
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-300">
                        <td colSpan={2} className="px-3 py-2.5 border-r border-slate-300 text-left text-xs uppercase tracking-wider font-extrabold text-slate-900 bg-slate-200">
                          CONSOLIDADO MENSAL DE ABATE ({selectedMonth}):
                        </td>
                        <td className="px-4 py-2.5 border-r border-slate-300 text-xs font-extrabold uppercase bg-blue-100/80 text-blue-950">
                          TOTAL BOVINO MÊS
                        </td>
                        <td className="px-4 py-2.5 border-r border-slate-300 text-xs font-extrabold uppercase bg-amber-100/80 text-amber-950">
                          TOTAL SUÍNO MÊS
                        </td>
                        <td className="px-4 py-2.5 text-xs font-extrabold uppercase bg-red-100/80 text-[#c51d1f]">
                          TOTAL GERAL MÊS (CAB)
                        </td>
                      </tr>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-center border-b border-slate-200 text-[11px]">
                        <th className="px-3 py-2 border-r border-slate-200 text-left w-16">MARCA</th>
                        <th className="px-4 py-2 border-r border-slate-200 text-left">COOPERADO / TERCEIRO</th>
                        <th className="px-4 py-2 border-r border-slate-200 text-center text-slate-800">QTD BOVINOS</th>
                        <th className="px-4 py-2 border-r border-slate-200 text-center text-slate-800">QTD SUÍNOS</th>
                        <th className="px-4 py-2 text-center text-slate-900 font-extrabold">TOTAL CABEÇAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {monthlyMatrixData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 text-xs font-medium">
                            Nenhum lote agendado para o mês de {selectedMonth}.
                          </td>
                        </tr>
                      ) : (
                        monthlyMatrixData.map((row, idx) => {
                          const totalGeral = row.bov + row.sui + row.ovi;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors font-medium">
                              <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-200 text-center">{row.mark}</td>
                              <td className="px-4 py-1.5 font-semibold text-slate-800 border-r border-slate-200 text-left">
                                {row.name}
                                <span className="ml-2 text-[10px] uppercase font-bold text-slate-400">({row.userType})</span>
                              </td>
                              <td className="px-4 py-1.5 border-r border-slate-200 font-bold text-blue-700 text-center bg-blue-50/20">{row.bov || '-'}</td>
                              <td className="px-4 py-1.5 border-r border-slate-200 font-bold text-amber-700 text-center bg-amber-50/20">{row.sui || '-'}</td>
                              <td className="px-4 py-1.5 font-extrabold text-[#c51d1f] text-center bg-red-50/30 text-xs">{totalGeral || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      {(() => {
                        const daysToRender = currentAgendaDays.map((day, idx) => ({ day, originalIdx: idx }));

                        return (
                          <>
                            <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-300">
                              <td colSpan={2} className="px-3 py-2.5 border-r border-slate-300 text-left text-xs uppercase tracking-wider font-bold">
                                AGENDADOS:
                              </td>
                              {daysToRender.map((item) => (
                                <td key={`day-label-${item.originalIdx}`} colSpan={2} className="px-2 py-2.5 border-r border-slate-300 text-xs font-bold uppercase bg-slate-300/40">
                                  {item.day.label}
                                </td>
                              ))}
                            </tr>

                            <tr className="bg-slate-50 text-slate-900 font-bold text-center text-xs border-b border-slate-200">
                              <td colSpan={2} className="px-3 py-2 border-r border-slate-200 text-left uppercase text-xs font-bold">
                                TOTAL DIA (CAB):
                              </td>
                              {daysToRender.map((item, idx) => (
                                <td key={`tot-dia-${item.originalIdx}`} colSpan={2} className="px-2 py-2 border-r border-slate-200 text-sm font-bold text-[#c51d1f]">
                                  {weeklyMatrixData.dayTotals[idx]?.total || 0}
                                </td>
                              ))}
                            </tr>

                            <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-center border-b border-slate-200 text-[11px]">
                              <th className="px-3 py-2 border-r border-slate-200 text-left w-16">MARCA</th>
                              <th className="px-4 py-2 border-r border-slate-200 text-left">COOPERADO / TERCEIRO</th>
                              {daysToRender.map((item) => (
                                <React.Fragment key={`subhead-${item.originalIdx}`}>
                                  <th className="px-2 py-1.5 border-r border-slate-200 text-slate-800 w-14">BOVINO</th>
                                  <th className="px-2 py-1.5 border-r border-slate-200 text-slate-800 w-14">SUÍNO</th>
                                </React.Fragment>
                              ))}
                            </tr>
                          </>
                        );
                      })()}
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {weeklyMatrixData.producers.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="text-center py-10 text-slate-400 text-xs font-medium">
                            Nenhum agendamento de abate nesta semana ({currentAgendaDays[0]?.shortLabel} a {currentAgendaDays[5]?.shortLabel}).
                          </td>
                        </tr>
                      ) : (
                        weeklyMatrixData.producers.map((prod, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors font-medium">
                            <td className="px-3 py-1.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-200 text-center">{prod.mark}</td>
                            <td className="px-4 py-1.5 font-semibold text-slate-800 border-r border-slate-200">
                              {prod.name}
                              <span className="ml-2 text-[10px] uppercase font-bold text-slate-400">({prod.userType})</span>
                            </td>
                            {currentAgendaDays.map((day, dayIdx) => {
                              const dayData = prod.days[day.fullDateStr];
                              return (
                                <React.Fragment key={`cell-${dayIdx}`}>
                                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-medium text-slate-800">
                                    {dayData?.bov ? dayData.bov : '-'}
                                  </td>
                                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-medium text-slate-800">
                                    {dayData?.sui ? dayData.sui : '-'}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>

          {/* TABELA DE AGENDAMENTOS CADASTRADOS */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Agendamentos Registrados no Supabase ({schedules.length} registros)
              </span>
              {schedules.filter((s) => s.userType === 'terceiro' && s.status === 'pendente_aprovacao').length > 0 && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {schedules.filter((s) => s.userType === 'terceiro' && s.status === 'pendente_aprovacao').length} Terceiro(s) aguardando aprovação
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Lote / Usuário</th>
                    <th className="text-left px-4 py-2.5 font-medium">Espécie / Qtd</th>
                    <th className="text-left px-4 py-2.5 font-medium">Aprovação Abate</th>
                    <th className="text-left px-4 py-2.5 font-medium">Guia GTA</th>
                    <th className="text-left px-4 py-2.5 font-medium">Data Abate</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status Chegada</th>
                    <th className="text-[#c51d1f] text-center px-4 py-2.5 font-bold">Ações & Ordem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          {sch.userName}
                          <Badge variant={sch.userType === 'cooperado' ? 'blue' : 'purple'}>{sch.userType}</Badge>
                        </div>
                        <div className="text-xs text-gray-400">Agendado em: {sch.scheduledDate}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        <span className="font-semibold text-gray-700">{sch.quantity}x {sch.animalType}</span>
                        <div className="text-xs text-gray-400">Taxa: R$ {sch.totalFee.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {sch.userType === 'terceiro' ? (
                          sch.status === 'pendente_aprovacao' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3" /> Aguardando Aprovação
                            </span>
                          ) : sch.status === 'rejeitado' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <X className="w-3 h-3" /> Rejeitado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Aprovado Adm
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" /> Cooperado (Liberado)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs font-mono font-medium text-gray-700">
                          <FileCheck className="w-3.5 h-3.5 text-green-600" />
                          {sch.gtaNumber || 'GTA-Pendente'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{sch.slaughterDate}</td>
                      <td className="px-4 py-3">
                        {sch.arrivalConfirmed ? (
                          <div>
                            <span className="text-green-700 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {sch.confirmedQuantity || sch.quantity} de {sch.quantity} cabeças no curral
                            </span>
                            <span className="text-[10px] text-gray-400 block">{sch.arrivalConfirmedAt}</span>
                            {sch.arrivalNotes && <span className="text-[10px] text-amber-700 italic block">Obs: {sch.arrivalNotes}</span>}
                          </div>
                        ) : sch.noShowAlert ? (
                          <span className="text-amber-700 text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Ausência Emitida
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmArrivalModalSchedule(sch)}
                            className="text-xs bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" /> Confirmar Chegada Cabeças
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {sch.userType === 'terceiro' && sch.status === 'pendente_aprovacao' ? (
                            <>
                              <button
                                onClick={() => handleApproveThirdPartySchedule(sch)}
                                disabled={updateStatusMutation.isPending}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded transition-colors shadow-sm disabled:opacity-50"
                                title="Aprovar Abate de Terceiro"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleRejectThirdPartySchedule(sch)}
                                disabled={updateStatusMutation.isPending}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50"
                                title="Rejeitar Solicitação"
                              >
                                Rejeitar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleNoShowAlert(sch)}
                                disabled={updateStatusMutation.isPending}
                                className={`text-xs p-1.5 rounded border transition-colors ${
                                  sch.noShowAlert
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'text-gray-400 border-gray-200 hover:text-amber-600'
                                }`}
                                title={sch.noShowAlert ? 'Remover Alerta' : 'Notificar Ausência'}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPrintSchedule(sch)}
                                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 px-2 py-1 rounded flex items-center gap-1 font-medium"
                              >
                                <Printer className="w-3.5 h-3.5" /> Imprimir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                        Nenhum agendamento de abate cadastrado no banco de dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isAddScheduleOpen && <AddScheduleModal onClose={() => setIsAddScheduleOpen(false)} />}
      {confirmArrivalModalSchedule && (
        <ConfirmArrivalModal
          schedule={confirmArrivalModalSchedule}
          onClose={() => setConfirmArrivalModalSchedule(null)}
        />
      )}
      {printSchedule && <PrintScheduleModal schedule={printSchedule} onClose={() => setPrintSchedule(null)} />}
    </div>
  );
}
