import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  Download, 
  RotateCw, 
  Edit3, 
  Trash2, 
  Copy, 
  User, 
  Users, 
  Calendar, 
  CalendarRange,
  CreditCard,
  Tag,
  Receipt,
  Layers,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { CategoryColors, CategoryMap, CoupleProfile, DateRangePreset, FilterState, Transaction } from '../types';
import { formatCurrency, formatDateEs, getDateRangeDescription } from '../utils/formatters';

interface TransactionsTableProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  categoryMap: CategoryMap;
  categoryColors: CategoryColors;
  profile: CoupleProfile;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (tx: Transaction) => void;
  onExportCSV: () => void;
  onResetData: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  filteredTransactions,
  filters,
  onFilterChange,
  onResetFilters,
  categoryMap,
  categoryColors,
  profile,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
  onExportCSV,
  onResetData,
}) => {
  const [showDateInputs, setShowDateInputs] = useState<boolean>(
    filters.dateRange === 'custom' || Boolean(filters.startDate || filters.endDate)
  );

  const isUser1 = profile.currentUser === 'user1';
  const currentUserName = isUser1 ? profile.user1Name : profile.user2Name;
  const partnerName = isUser1 ? profile.user2Name : profile.user1Name;

  const totalFilteredAmount = filteredTransactions.reduce((acc, t) => acc + (t.monto || 0), 0);

  const hasActiveFilters = 
    Boolean(filters.search) || 
    filters.mode !== 'all' || 
    filters.categoria !== 'ALL' || 
    filters.subcategoria !== 'ALL' || 
    (filters.soloCuotas && filters.soloCuotas !== 'ALL') || 
    filters.dateRange !== 'all' || 
    Boolean(filters.selectedMonth) || 
    Boolean(filters.startDate || filters.endDate);

  const handleDatePresetChange = (val: string) => {
    if (val === 'custom') {
      setShowDateInputs(true);
      onFilterChange({ dateRange: 'custom', selectedMonth: undefined });
    } else {
      setShowDateInputs(false);
      onFilterChange({ 
        dateRange: val as DateRangePreset, 
        startDate: undefined, 
        endDate: undefined,
        selectedMonth: undefined 
      });
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden space-y-4">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Detalle de Transacciones</span>
            </h2>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
              Total: {formatCurrency(totalFilteredAmount, profile.currency)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mostrando {filteredTransactions.length} de {transactions.length} transacciones registradas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
              title="Restablecer filtros de búsqueda"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Limpiar Filtros</span>
            </button>
          )}

          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
            title="Descargar archivo Excel / CSV de los registros filtrados"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onResetData}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
            title="Restablecer a datos iniciales"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Restablecer Todo</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-4 sm:px-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
          {/* Search */}
          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Buscar por concepto..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Date Filter Selector */}
          <div className="md:col-span-3 relative">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none" />
              <select
                value={filters.selectedMonth ? 'month' : filters.dateRange}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                  filters.dateRange !== 'all' || filters.selectedMonth
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">📅 Fecha: Todo el historial</option>
                <option value="today">📅 Fecha: Hoy</option>
                <option value="this_week">📅 Fecha: Esta semana</option>
                <option value="this_month">📅 Fecha: Este mes</option>
                <option value="last_month">📅 Fecha: Mes anterior</option>
                <option value="last_30_days">📅 Fecha: Últimos 30 días</option>
                <option value="last_90_days">📅 Fecha: Últimos 90 días</option>
                <option value="this_year">📅 Fecha: Este año</option>
                <option value="custom">📅 Fecha: Rango personalizado...</option>
              </select>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="md:col-span-2">
            <select
              value={filters.mode}
              onChange={(e) => onFilterChange({ mode: e.target.value as any })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="all">Modo: Todos</option>
              <option value="individual">Modo: Individual</option>
              <option value="pareja">Modo: En Pareja</option>
            </select>
          </div>

          {/* Category */}
          <div className="md:col-span-2">
            <select
              value={filters.categoria}
              onChange={(e) => onFilterChange({ categoria: e.target.value, subcategoria: 'ALL' })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="ALL">Todas las Categorías</option>
              {Object.keys(categoryMap).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Financing / Installment Filter */}
          <div className="md:col-span-2">
            <select
              value={filters.soloCuotas || 'ALL'}
              onChange={(e) => onFilterChange({ soloCuotas: e.target.value as any })}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            >
              <option value="ALL">Financiamiento: Todos</option>
              <option value="solo_cuotas">💳 Solo en Cuotas</option>
              <option value="sin_cuotas">Sin Cuotas (1 pago)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker Row (When Custom is selected) */}
        {(showDateInputs || filters.dateRange === 'custom') && (
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <CalendarRange className="w-4 h-4 text-indigo-600" />
              <span>Filtrar por rango exacto:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-slate-400 font-medium mr-1.5">Desde:</span>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => onFilterChange({
                    dateRange: 'custom',
                    startDate: e.target.value,
                    selectedMonth: undefined
                  })}
                  className="bg-transparent text-slate-800 focus:outline-none text-xs font-medium"
                />
              </div>

              <div className="flex items-center bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-slate-400 font-medium mr-1.5">Hasta:</span>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => onFilterChange({
                    dateRange: 'custom',
                    endDate: e.target.value,
                    selectedMonth: undefined
                  })}
                  className="bg-transparent text-slate-800 focus:outline-none text-xs font-medium"
                />
              </div>

              {(filters.startDate || filters.endDate) && (
                <button
                  onClick={() => onFilterChange({ startDate: undefined, endDate: undefined, dateRange: 'all' })}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2 py-1 rounded-lg transition-colors"
                >
                  Limpiar Fechas
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Filtros activos:</span>
            
            {/* Date filter badge */}
            {(filters.dateRange !== 'all' || filters.selectedMonth || filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]">
                <Calendar className="w-3 h-3 text-indigo-600" />
                <span>Fecha: {getDateRangeDescription(filters.dateRange, filters.startDate, filters.endDate, filters.selectedMonth)}</span>
                <button
                  onClick={() => onFilterChange({ dateRange: 'all', startDate: undefined, endDate: undefined, selectedMonth: undefined })}
                  className="hover:text-indigo-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Category badge */}
            {filters.categoria !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[filters.categoria] || '#64748b' }} />
                <span>Cat: {filters.categoria}</span>
                <button
                  onClick={() => onFilterChange({ categoria: 'ALL', subcategoria: 'ALL' })}
                  className="hover:text-slate-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Mode badge */}
            {filters.mode !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                <span>Modo: {filters.mode === 'individual' ? 'Individual' : 'Pareja'}</span>
                <button
                  onClick={() => onFilterChange({ mode: 'all' })}
                  className="hover:text-slate-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search badge */}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                <span>Texto: "{filters.search}"</span>
                <button
                  onClick={() => onFilterChange({ search: '' })}
                  className="hover:text-slate-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Installments badge */}
            {filters.soloCuotas && filters.soloCuotas !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                <span>{filters.soloCuotas === 'solo_cuotas' ? 'Solo Cuotas' : 'Sin Cuotas'}</span>
                <button
                  onClick={() => onFilterChange({ soloCuotas: 'ALL' })}
                  className="hover:text-slate-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-y border-slate-100">
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Concepto & Detalle</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Categoría / Subcat</th>
              <th className="py-3 px-4">Pagado Por</th>
              <th className="py-3 px-4 text-right">Monto Total</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => {
                const color = categoryColors[tx.categoria] || '#64748b';
                const payerName = tx.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name;
                const isInstallment = Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1));
                const totalCuotas = tx.cuotasTotal || 1;
                const currentCuota = tx.cuotaActual || 1;
                const cuotaMonto = tx.montoCuota || (tx.monto / totalCuotas);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateEs(tx.fecha)}
                    </td>

                    {/* Concept & Description */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{tx.concepto}</div>
                      {tx.descripcion && (
                        <div className="text-[11px] text-slate-500">{tx.descripcion}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {tx.metodoPago && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {tx.metodoPago}
                          </span>
                        )}

                        {/* Installment Badge */}
                        {isInstallment && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                            <span>{totalCuotas} cuotas de {formatCurrency(cuotaMonto, tx.moneda || profile.currency)}</span>
                            <span className="text-indigo-900 bg-indigo-100 px-1 rounded font-mono text-[9px]">
                              Cuota {currentCuota}/{totalCuotas}
                            </span>
                          </span>
                        )}

                        {tx.tarjetaNombre && (
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            {tx.tarjetaNombre}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.tipo === 'pareja' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                          <Users className="w-3 h-3" /> Pareja ({tx.splitType === '50_50' ? '50/50' : tx.splitType})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <User className="w-3 h-3" /> Individual
                        </span>
                      )}
                    </td>

                    {/* Category & Subcategory */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-slate-700">{tx.categoria}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-3.5">{tx.subcategoria}</div>
                    </td>

                    {/* Paid By */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {payerName}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-bold text-slate-900 text-right whitespace-nowrap text-sm">
                      {formatCurrency(tx.monto, tx.moneda || profile.currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap space-x-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar Gasto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateTransaction(tx)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Duplicar Gasto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                  No se encontraron transacciones con los filtros y fechas seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100 px-3 pb-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const color = categoryColors[tx.categoria] || '#64748b';
            const payerName = tx.pagadoPor === 'user1' ? profile.user1Name : profile.user2Name;
            const isInstallment = Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1));
            const totalCuotas = tx.cuotasTotal || 1;
            const currentCuota = tx.cuotaActual || 1;
            const cuotaMonto = tx.montoCuota || (tx.monto / totalCuotas);

            return (
              <div key={tx.id} className="py-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{tx.concepto}</h4>
                    {tx.descripcion && (
                      <p className="text-xs text-slate-500">{tx.descripcion}</p>
                    )}
                  </div>
                  <span className="text-base font-bold text-slate-900 shrink-0">
                    {formatCurrency(tx.monto, tx.moneda || profile.currency)}
                  </span>
                </div>

                {isInstallment && (
                  <div className="p-2 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{totalCuotas} cuotas de {formatCurrency(cuotaMonto, tx.moneda || profile.currency)}</span>
                    </span>
                    <span className="bg-indigo-200/70 text-indigo-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      Cuota {currentCuota}/{totalCuotas}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>{tx.categoria} › {tx.subcategoria}</span>
                  </span>

                  {tx.tipo === 'pareja' ? (
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                      Pareja ({payerName})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {payerName}
                    </span>
                  )}

                  <span className="text-slate-400 ml-auto font-mono text-[10px]">
                    {formatDateEs(tx.fecha)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50 text-xs">
                  <button
                    onClick={() => onEditTransaction(tx)}
                    className="p-1 text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => onDuplicateTransaction(tx)}
                    className="p-1 text-slate-400 hover:text-emerald-600 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicar</span>
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            No se encontraron transacciones con las fechas y filtros actuales.
          </div>
        )}
      </div>
    </section>
  );
};
