import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Filter, 
  Clock, 
  CalendarRange, 
  Check, 
  SlidersHorizontal,
  Pin,
  PinOff
} from 'lucide-react';
import { DateRangePreset, FilterState, Transaction } from '../types';
import { formatDateEs, getDateRangeDescription, formatCurrency } from '../utils/formatters';

interface DateFilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  currency?: string;
  isCompact?: boolean;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  filters,
  onFilterChange,
  transactions,
  filteredTransactions,
  currency = 'ARS',
  isCompact = false,
}) => {
  const [showCustomRange, setShowCustomRange] = useState<boolean>(
    filters.dateRange === 'custom' || Boolean(filters.startDate || filters.endDate)
  );
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);

  // Pin date range functionality
  const [isRangePinned, setIsRangePinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_is_filterbar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  // Load pinned state data if pinned previously
  useEffect(() => {
    try {
      const isPinned = localStorage.getItem('gastoar_is_filterbar_pinned') === 'true';
      if (isPinned) {
        const saved = localStorage.getItem('gastoar_pinned_filterbar_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          onFilterChange({
            dateRange: parsed.dateRange || 'all',
            startDate: parsed.startDate,
            endDate: parsed.endDate,
            selectedMonth: parsed.selectedMonth,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const togglePinRange = (newVal?: boolean) => {
    const targetVal = typeof newVal === 'boolean' ? newVal : !isRangePinned;
    setIsRangePinned(targetVal);
    try {
      localStorage.setItem('gastoar_is_filterbar_pinned', String(targetVal));
      if (targetVal) {
        localStorage.setItem('gastoar_pinned_filterbar_data', JSON.stringify({
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
          selectedMonth: filters.selectedMonth,
        }));
      } else {
        localStorage.removeItem('gastoar_pinned_filterbar_data');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Keep stored pinned data updated if user adjusts dates while pinned
  useEffect(() => {
    if (isRangePinned) {
      try {
        localStorage.setItem('gastoar_pinned_filterbar_data', JSON.stringify({
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
          selectedMonth: filters.selectedMonth,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isRangePinned, filters.dateRange, filters.startDate, filters.endDate, filters.selectedMonth]);

  // Extract all distinct year-months present in transactions for easy month picking
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    
    // Add current month and last month always
    const now = new Date();
    const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(curMonthStr);
    monthSet.add(prevMonthStr);

    transactions.forEach(t => {
      if (t.fecha && t.fecha.length >= 7) {
        monthSet.add(t.fecha.slice(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse().map(ym => {
      const [year, month] = ym.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      return {
        key: ym,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        year,
        month,
      };
    });
  }, [transactions]);

  const presets: { id: DateRangePreset; label: string; icon?: string }[] = [
    { id: 'all', label: 'Todo el Historial' },
    { id: 'today', label: 'Hoy' },
    { id: 'this_week', label: 'Esta Semana' },
    { id: 'this_month', label: 'Este Mes' },
    { id: 'last_month', label: 'Mes Anterior' },
    { id: 'last_30_days', label: 'Últimos 30 días' },
    { id: 'this_year', label: 'Este Año' },
    { id: 'custom', label: 'Personalizado' },
  ];

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomRange(true);
      onFilterChange({
        dateRange: 'custom',
        selectedMonth: undefined,
      });
    } else {
      setShowCustomRange(false);
      onFilterChange({
        dateRange: preset,
        startDate: undefined,
        endDate: undefined,
        selectedMonth: undefined,
      });
    }
  };

  const handleSelectMonth = (monthKey: string) => {
    setShowMonthDropdown(false);
    setShowCustomRange(false);
    onFilterChange({
      dateRange: 'all',
      selectedMonth: monthKey,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleResetDate = () => {
    setShowCustomRange(false);
    onFilterChange({
      dateRange: 'all',
      startDate: undefined,
      endDate: undefined,
      selectedMonth: undefined,
    });
  };

  const isFiltered = filters.dateRange !== 'all' || Boolean(filters.selectedMonth) || Boolean(filters.startDate || filters.endDate);
  const activeDesc = getDateRangeDescription(filters.dateRange, filters.startDate, filters.endDate, filters.selectedMonth);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [filteredTransactions]);

  return (
    <div className={`bg-white rounded-2xl border transition-all p-3.5 sm:p-4 space-y-3 ${
      isRangePinned 
        ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm' 
        : 'border-slate-200/90 shadow-xs'
    }`}>
      {/* Top row: Status, Active Period, Pin Button, Count & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-xs border ${
            isRangePinned 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
          }`}>
            {isRangePinned ? (
              <Pin className="w-3.5 h-3.5 fill-white rotate-45" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>Filtro por Fecha:</span>
            <span className={isRangePinned ? 'text-white font-black' : 'text-indigo-950 font-semibold'}>{activeDesc}</span>
            {isRangePinned && (
              <span className="ml-1 text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                Fijado
              </span>
            )}
          </div>

          {/* Quick Pin Toggle Button */}
          <button
            type="button"
            onClick={() => togglePinRange()}
            title={isRangePinned ? "Desfijar rango de fechas" : "Fijar rango de fechas actual"}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
              isRangePinned
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${isRangePinned ? 'text-indigo-600 fill-indigo-600 rotate-45' : 'text-slate-500'}`} />
            <span className="hidden xs:inline">{isRangePinned ? 'Fijado' : 'Fijar Fecha'}</span>
          </button>

          {isFiltered && !isRangePinned && (
            <button
              onClick={handleResetDate}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
              title="Quitar filtro de fecha"
            >
              <X className="w-3 h-3" />
              <span>Ver Todo</span>
            </button>
          )}
        </div>

        {/* Total & Match count for period */}
        <div className="flex items-center gap-2 text-xs text-slate-600 self-end sm:self-center">
          <span className="text-slate-400">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'gasto' : 'gastos'} en el período
          </span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            {formatCurrency(totalFilteredAmount, currency)}
          </span>
        </div>
      </div>

      {/* Preset Pills, Month Dropdown & Pin Checkbox Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => {
            const isActive = !filters.selectedMonth && filters.dateRange === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset.id === 'custom' && <CalendarRange className="w-3.5 h-3.5" />}
                <span>{preset.label}</span>
              </button>
            );
          })}

          {/* Month Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border active:scale-95 ${
                filters.selectedMonth
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {filters.selectedMonth
                  ? availableMonths.find(m => m.key === filters.selectedMonth)?.label || filters.selectedMonth
                  : 'Elegir Mes Específico'}
              </span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showMonthDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMonthDropdown(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-56 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 divide-y divide-slate-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Meses disponibles
                  </div>
                  <div className="py-1 space-y-0.5">
                    {availableMonths.map((m) => {
                      const isSelected = filters.selectedMonth === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => handleSelectMonth(m.key)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{m.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Casilla interactiva para fijar rango de fechas */}
        <label 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all text-xs font-semibold ${
            isRangePinned 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs' 
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
          }`}
          title="Mantener fijado este rango de fechas en esta ventana"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <input
              type="checkbox"
              checked={isRangePinned}
              onChange={(e) => togglePinRange(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
              isRangePinned
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-white border-slate-300'
            }`}>
              {isRangePinned && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
          <span className="flex items-center gap-1">
            <Pin className={`w-3 h-3 ${isRangePinned ? 'text-indigo-600 fill-indigo-600 rotate-45' : 'text-slate-400'}`} />
            Fijar rango de fechas
          </span>
        </label>
      </div>

      {/* Custom Date Range Picker Inputs */}
      {(showCustomRange || filters.dateRange === 'custom') && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 shrink-0">
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span>Rango de fechas:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-w-lg">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="text-[11px] text-slate-400 font-medium mr-2">Desde:</span>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({
                  dateRange: 'custom',
                  selectedMonth: undefined,
                  startDate: e.target.value,
                })}
                className="w-full text-xs font-medium text-slate-800 focus:outline-none bg-transparent"
              />
              {filters.startDate && (
                <button
                  onClick={() => onFilterChange({ startDate: undefined })}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpiar fecha inicial"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="text-[11px] text-slate-400 font-medium mr-2">Hasta:</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({
                  dateRange: 'custom',
                  selectedMonth: undefined,
                  endDate: e.target.value,
                })}
                className="w-full text-xs font-medium text-slate-800 focus:outline-none bg-transparent"
              />
              {filters.endDate && (
                <button
                  onClick={() => onFilterChange({ endDate: undefined })}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpiar fecha final"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {(filters.startDate || filters.endDate) && (
            <button
              onClick={() => onFilterChange({ startDate: undefined, endDate: undefined, dateRange: 'all' })}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 bg-rose-50 rounded-lg self-end sm:self-center"
            >
              Borrar Rango
            </button>
          )}
        </div>
      )}
    </div>
  );
};
