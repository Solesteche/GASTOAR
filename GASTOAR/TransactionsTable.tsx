import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Receipt, 
  RotateCcw, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal, 
  Layers, 
  ShoppingCart, 
  Bus, 
  Zap, 
  Ticket, 
  HeartPulse, 
  Home, 
  DollarSign, 
  Music, 
  BookOpen, 
  Shirt, 
  Laptop, 
  Package, 
  Plus, 
  X, 
  Check, 
  Edit3, 
  Trash2, 
  Copy, 
  Filter, 
  CreditCard, 
  Sparkles, 
  MoreHorizontal,
  ArrowUpDown,
  CalendarRange,
  Users,
  LayoutGrid
} from 'lucide-react';
import { 
  CategoryColors, 
  CategoryMap, 
  CoupleProfile, 
  DateRangePreset, 
  ExpenseMode,
  FilterState, 
  Transaction 
} from '../types';
import { formatCurrency, formatDateEs } from '../utils/formatters';

interface TransactionsTableProps {
  transactions?: Transaction[];
  filteredTransactions?: Transaction[];
  filters?: FilterState;
  onFilterChange?: (newFilters: Partial<FilterState>) => void;
  onResetFilters?: () => void;
  categoryMap?: CategoryMap;
  categoryColors?: CategoryColors;
  profile: CoupleProfile;
  onEditTransaction?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicateTransaction?: (tx: Transaction) => void;
  onExportCSV?: () => void;
  onResetData?: () => void;
  onNavigateTab?: (tab: any) => void;
  onOpenCloudSync?: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  mode: 'all',
  categoria: 'ALL',
  subcategoria: 'ALL',
  dateRange: 'all',
  pagadoPor: 'ALL',
  metodoPago: 'ALL',
  soloCuotas: 'ALL',
};

// Helper to determine category icon and soft pastel background
const getCategoryVisuals = (catName?: string, tipo?: string) => {
  if (tipo === 'ingreso') {
    return {
      icon: DollarSign,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
  }
  const lower = (catName || '').toLowerCase();
  if (lower.includes('alimento') || lower.includes('supermercado') || lower.includes('comida') || lower.includes('coto') || lower.includes('carrefour') || lower.includes('dia')) {
    return {
      icon: ShoppingCart,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100'
    };
  }
  if (lower.includes('transporte') || lower.includes('colectivo') || lower.includes('sube') || lower.includes('viaje') || lower.includes('auto') || lower.includes('nafta') || lower.includes('uber')) {
    return {
      icon: Bus,
      bg: 'bg-orange-50',
      text: 'text-[#F95420]',
      border: 'border-orange-100',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-100'
    };
  }
  if (lower.includes('servicio') || lower.includes('luz') || lower.includes('agua') || lower.includes('gas') || lower.includes('edenor') || lower.includes('aysa') || lower.includes('metrogas')) {
    return {
      icon: Zap,
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-100'
    };
  }
  if (lower.includes('entretenimiento') || lower.includes('cine') || lower.includes('salida') || lower.includes('ocio') || lower.includes('hoyts') || lower.includes('teatro')) {
    return {
      icon: Ticket,
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-100',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-100'
    };
  }
  if (lower.includes('salud') || lower.includes('farmacia') || lower.includes('farmacity') || lower.includes('médico') || lower.includes('medico') || lower.includes('remedio')) {
    return {
      icon: HeartPulse,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
  }
  if (lower.includes('hogar') || lower.includes('alquiler') || lower.includes('expensas') || lower.includes('mueble') || lower.includes('casa')) {
    return {
      icon: Home,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100'
    };
  }
  if (lower.includes('streaming') || lower.includes('música') || lower.includes('musica') || lower.includes('spotify') || lower.includes('netflix') || lower.includes('youtube')) {
    return {
      icon: Music,
      bg: 'bg-purple-50',
      text: 'text-[#6F2EC5]',
      border: 'border-purple-100',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100'
    };
  }
  if (lower.includes('educación') || lower.includes('educacion') || lower.includes('curso') || lower.includes('libro')) {
    return {
      icon: BookOpen,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100'
    };
  }
  if (lower.includes('ropa') || lower.includes('indumentaria') || lower.includes('calzado') || lower.includes('zapatillas')) {
    return {
      icon: Shirt,
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-100'
    };
  }
  if (lower.includes('tecnología') || lower.includes('tecnologia') || lower.includes('computación')) {
    return {
      icon: Laptop,
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };
  }
  return {
    icon: Package,
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200'
  };
};

// Friendly date formatting e.g. "Hoy, 10:30", "Ayer, 18:40", "20/05/2026"
const formatFriendlyDate = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const today = new Date();
  const isToday = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = yesterday.getFullYear() === y && yesterday.getMonth() + 1 === m && yesterday.getDate() === d;

  const timeSuffix = timeStr ? `, ${timeStr}` : '';

  if (isToday) return `Hoy${timeSuffix}`;
  if (isYesterday) return `Ayer${timeSuffix}`;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d)}/${pad(m)}/${y}${timeSuffix}`;
};

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions = [],
  filteredTransactions,
  filters = DEFAULT_FILTERS,
  onFilterChange = (_: Partial<FilterState>) => {},
  onResetFilters = () => {},
  categoryMap = {},
  categoryColors = {},
  profile,
  onEditTransaction,
  onEdit,
  onDeleteTransaction,
  onDelete,
  onDuplicateTransaction = () => {},
  onExportCSV = () => {},
  onResetData = () => {},
  onNavigateTab,
  onOpenCloudSync,
}) => {
  const effectiveFiltered = filteredTransactions || transactions || [];
  const effectiveTransactions = transactions || filteredTransactions || [];
  const handleEdit = onEditTransaction || onEdit || (() => {});
  const handleDelete = onDeleteTransaction || onDelete || (() => {});

  const activeFilters: FilterState = {
    ...DEFAULT_FILTERS,
    ...filters,
  };

  // Date Dropdown state
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [showCustomDates, setShowCustomDates] = useState(
    activeFilters.dateRange === 'custom' || Boolean(activeFilters.startDate || activeFilters.endDate)
  );
  const dateMenuRef = useRef<HTMLDivElement>(null);

  // Pin state
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gastoar_is_filterbar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    try {
      localStorage.setItem('gastoar_is_filterbar_pinned', String(next));
    } catch {}
  };

  // Sorting state
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'highest' | 'lowest'>('recent');

  // Pagination state (8 to 10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Close date menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setIsDateMenuOpen(false);
      }
    };
    if (isDateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateMenuOpen]);

  // Carousel scroll state for mobile 4-card pagination
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCarouselPage, setActiveCarouselPage] = useState<number>(0);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      setActiveCarouselPage(page);
    }
  };

  const scrollToCarouselPage = (pageIndex: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({
      left: pageIndex * carouselRef.current.clientWidth,
      behavior: 'smooth',
    });
    setActiveCarouselPage(pageIndex);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // User identity
  const isUser1 = profile.currentUser === 'user1';
  const user1Name = profile.user1Name || 'Usuario 1';
  const user2Name = profile.user2Name || 'Usuario 2';

  // Total filtered amount
  const totalFilteredAmount = useMemo(() => {
    return effectiveFiltered.reduce((acc, t) => acc + (t?.monto || 0), 0);
  }, [effectiveFiltered]);

  // Get active date range human title
  const getDateRangeTitle = () => {
    if (activeFilters.selectedMonth) {
      const [y, m] = activeFilters.selectedMonth.split('-');
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${months[parseInt(m, 10) - 1] || m} ${y}`;
    }
    if (activeFilters.startDate && activeFilters.endDate) {
      return `${formatDateEs(activeFilters.startDate)} - ${formatDateEs(activeFilters.endDate)}`;
    }
    switch (activeFilters.dateRange) {
      case 'today': return 'Hoy';
      case 'this_week': return 'Esta semana';
      case 'this_month': return 'Este mes';
      case 'last_month': return 'Mes anterior';
      case 'last_30_days': return 'Últimos 30 días';
      case 'last_90_days': return 'Últimos 90 días';
      case 'this_year': return 'Este año';
      case 'custom': return 'Rango personalizado';
      case 'all':
      default:
        return 'Todo el historial';
    }
  };

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomDates(true);
      onFilterChange({ dateRange: 'custom', selectedMonth: undefined });
    } else {
      setShowCustomDates(false);
      onFilterChange({
        dateRange: preset,
        startDate: undefined,
        endDate: undefined,
        selectedMonth: undefined
      });
    }
    setIsDateMenuOpen(false);
  };

  // Category totals for horizontal carousel
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    effectiveFiltered.forEach(t => {
      const cat = t.categoria || 'Otros';
      totals[cat] = (totals[cat] || 0) + (t.monto || 0);
    });
    return totals;
  }, [effectiveFiltered]);

  // Priority categories for carousel matching design:
  // Todas, Alimentos, Transporte, Servicios, Hogar, Salud, Entretenimiento, plus others
  const carouselCategories = useMemo(() => {
    const primaryCats = ['Alimentos', 'Transporte', 'Servicios', 'Hogar', 'Salud', 'Entretenimiento'];
    const allKnownCats = Object.keys(categoryMap);
    const existingInTransactions = Object.keys(categoryTotals);
    const combined = Array.from(new Set([...primaryCats, ...allKnownCats, ...existingInTransactions]));
    return combined;
  }, [categoryMap, categoryTotals]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...effectiveFiltered].sort((a, b) => {
      if (sortBy === 'recent') {
        const diff = (b.fecha || '').localeCompare(a.fecha || '');
        if (diff !== 0) return diff;
        return (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'oldest') {
        const diff = (a.fecha || '').localeCompare(b.fecha || '');
        if (diff !== 0) return diff;
        return (a.id || '').localeCompare(b.id || '');
      }
      if (sortBy === 'highest') {
        return (b.monto || 0) - (a.monto || 0);
      }
      if (sortBy === 'lowest') {
        return (a.monto || 0) - (b.monto || 0);
      }
      return 0;
    });
  }, [effectiveFiltered, sortBy]);

  // Paginate transactions
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans pb-16">

      {/* ROW 1: HERO MOVIMIENTOS CARD (Full Width with Purple Gradient matching Resumen) */}
      <div className="w-full bg-gradient-to-br from-[#2E0854] via-[#45108A] to-[#6F2EC5] rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-purple-950/20 border border-purple-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Icon + Title + Subtitle */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-xs text-white border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Movimientos
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 font-medium mt-0.5">
              Mostrando {effectiveFiltered.length} de {effectiveTransactions.length} transacciones
            </p>
          </div>
        </div>

        {/* Right: Total Section (No white background, all white text) */}
        <div className="self-start sm:self-center shrink-0 text-left sm:text-right">
          <span className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Total
          </span>
          <span className="block text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            {formatCurrency(totalFilteredAmount, profile.currency)}
          </span>
        </div>
      </div>

      {/* ROW 2: SEARCH INPUT & 3 FILTER PILLS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-3 relative">
        
        {/* Search input with filter/reset button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={activeFilters.search ?? ''}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Buscar por concepto..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 rounded-2xl text-slate-600 hover:text-[#6F2EC5] transition-all cursor-pointer shadow-2xs shrink-0"
            title="Restablecer filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Dropdown Filter Pills (2-Tier Text Design as in Mockup) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          
          {/* Pill 1: Fecha */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDateMenuOpen(prev => !prev)}
              className="w-full bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-[#6F2EC5] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    Fecha
                  </span>
                  <span className="block text-xs font-bold text-slate-800 leading-tight truncate group-hover:text-[#6F2EC5] transition-colors">
                    {getDateRangeTitle()}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isDateMenuOpen ? 'rotate-180 text-[#6F2EC5]' : ''}`} />
            </button>

            {/* Date Preset Dropdown Modal/Popup */}
            {isDateMenuOpen && (
              <div 
                ref={dateMenuRef}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-purple-100 p-2 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-1"
              >
                <div className="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Seleccionar período
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto p-1 text-xs">
                  {[
                    { id: 'all', label: 'Todo el historial' },
                    { id: 'today', label: 'Hoy' },
                    { id: 'this_week', label: 'Esta semana' },
                    { id: 'this_month', label: 'Este mes' },
                    { id: 'last_month', label: 'Mes anterior' },
                    { id: 'last_30_days', label: 'Últimos 30 días' },
                    { id: 'last_90_days', label: 'Últimos 90 días' },
                    { id: 'this_year', label: 'Este año' },
                    { id: 'custom', label: 'Personalizado...' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPreset(item.id as DateRangePreset)}
                      className={`px-3 py-2 text-left rounded-xl font-bold transition-all cursor-pointer flex items-center justify-between ${
                        activeFilters.dateRange === item.id 
                          ? 'bg-purple-50 text-[#6F2EC5]' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeFilters.dateRange === item.id && <Check className="w-3.5 h-3.5 text-[#6F2EC5]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pill 2: Modo */}
          <div className="relative">
            <div className="w-full bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-2xs relative">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-[#6F2EC5] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    Modo
                  </span>
                  <span className="block text-xs font-bold text-slate-800 leading-tight truncate group-hover:text-[#6F2EC5] transition-colors">
                    {activeFilters.mode === 'pareja' ? 'Compartido' : activeFilters.mode === 'individual' ? 'Personal' : 'Todos'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              
              {/* Invisible native select over pill */}
              <select
                value={activeFilters.mode || 'all'}
                onChange={(e) => onFilterChange({ mode: e.target.value as ExpenseMode })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Filtrar por modo de gasto"
              >
                <option value="all">Modo: Todos</option>
                <option value="individual">Modo: Personal</option>
                <option value="pareja">Modo: Compartido</option>
              </select>
            </div>
          </div>

          {/* Pill 3: Categorías */}
          <div className="relative">
            <div className="w-full bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer group shadow-2xs relative">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-[#6F2EC5] flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-medium text-slate-400 leading-tight">
                    Categorías
                  </span>
                  <span className="block text-xs font-bold text-slate-800 leading-tight truncate group-hover:text-[#6F2EC5] transition-colors">
                    {activeFilters.categoria === 'ALL' ? 'Todas' : activeFilters.categoria}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />

              {/* Invisible native select over pill */}
              <select
                value={activeFilters.categoria || 'ALL'}
                onChange={(e) => onFilterChange({ categoria: e.target.value, subcategoria: 'ALL' })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Filtrar por categoría"
              >
                <option value="ALL">Todas las Categorías</option>
                {carouselCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Custom Date Range Inputs (when custom is selected) */}
        {(showCustomDates || activeFilters.dateRange === 'custom') && (
          <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-150">
            <span className="font-bold text-[#6F2EC5] text-[11px]">Rango de fechas:</span>
            <input
              type="date"
              value={activeFilters.startDate ?? ''}
              onChange={(e) => onFilterChange({ dateRange: 'custom', startDate: e.target.value, selectedMonth: undefined })}
              className="bg-white border border-purple-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="date"
              value={activeFilters.endDate ?? ''}
              onChange={(e) => onFilterChange({ dateRange: 'custom', endDate: e.target.value, selectedMonth: undefined })}
              className="bg-white border border-purple-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800"
            />
          </div>
        )}

      </div>

      {/* ROW 3: CATEGORÍAS CAROUSEL */}
      <div className="space-y-3 pt-1">
        
        {/* Header: Categorías + Ver todas > */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Categorías
          </h3>
          <button
            type="button"
            onClick={() => onFilterChange({ categoria: 'ALL', subcategoria: 'ALL' })}
            className="text-xs sm:text-sm font-bold text-[#6F2EC5] hover:text-[#5B21B6] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Cards Carousel (Sized to fit exactly 4 cards on mobile view) */}
        <div 
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none px-0.5 sm:px-1 snap-x snap-mandatory scroll-smooth"
        >
          
          {/* 1. TODAS Card */}
          <button
            type="button"
            onClick={() => onFilterChange({ categoria: 'ALL', subcategoria: 'ALL' })}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-2xl transition-all cursor-pointer shrink-0 snap-start w-[calc((100%-24px)/4)] min-w-[68px] sm:w-auto sm:min-w-[96px] border ${
              activeFilters.categoria === 'ALL'
                ? 'bg-purple-50/80 border-[#6F2EC5] shadow-xs'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-2xs'
            }`}
          >
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-1.5 transition-all shrink-0 ${
              activeFilters.categoria === 'ALL'
                ? 'bg-[#6F2EC5] text-white shadow-xs'
                : 'bg-purple-100/70 text-[#6F2EC5]'
            }`}>
              <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span className={`text-[10px] sm:text-xs font-bold truncate w-full text-center tracking-tight ${activeFilters.categoria === 'ALL' ? 'text-[#6F2EC5]' : 'text-slate-800'}`}>
              Todas
            </span>
            <span className={`text-[9px] sm:text-[11px] font-bold mt-0.5 truncate w-full text-center ${activeFilters.categoria === 'ALL' ? 'text-[#6F2EC5]' : 'text-slate-500'}`}>
              {formatCurrency(totalFilteredAmount, profile.currency)}
            </span>
          </button>

          {/* Dynamic Category Cards (Matching pastel styling from image) */}
          {carouselCategories.map((catName) => {
            const visuals = getCategoryVisuals(catName);
            const Icon = visuals.icon;
            const isSelected = activeFilters.categoria === catName;
            const catAmount = categoryTotals[catName] || 0;

            return (
              <button
                key={catName}
                type="button"
                onClick={() => onFilterChange({ 
                  categoria: isSelected ? 'ALL' : catName, 
                  subcategoria: 'ALL' 
                })}
                className={`flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-2xl transition-all cursor-pointer shrink-0 snap-start w-[calc((100%-24px)/4)] min-w-[68px] sm:w-auto sm:min-w-[96px] border ${
                  isSelected 
                    ? 'bg-purple-50/80 border-[#6F2EC5] shadow-xs' 
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-2xs'
                }`}
              >
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-1.5 transition-all border shrink-0 ${visuals.bg} ${visuals.text} ${visuals.border} shadow-2xs`}>
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold truncate w-full text-center tracking-tight ${isSelected ? 'text-[#6F2EC5]' : 'text-slate-800'}`}>
                  {catName}
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 mt-0.5 truncate w-full text-center">
                  {formatCurrency(catAmount, profile.currency)}
                </span>
              </button>
            );
          })}

        </div>

        {/* Carousel Slider Indicator (Matching image, interactive) */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: Math.max(4, Math.ceil((1 + carouselCategories.length) / 4)) }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToCarouselPage(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeCarouselPage === idx 
                  ? 'w-7 sm:w-8 bg-[#6F2EC5]' 
                  : 'w-3.5 sm:w-5 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Página ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ROW 4: MOVIMIENTOS HEADER (Count badge + Ordenar por) */}
      <div className="flex items-center justify-between gap-3 pt-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-wider uppercase">
            Movimientos
          </h3>
          <span className="bg-purple-100 text-[#6F2EC5] text-xs font-black px-2 py-0.5 rounded-full">
            {effectiveFiltered.length}
          </span>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-bold">Ordenar</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-2.5 pr-7 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs cursor-pointer"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="highest">Mayor monto</option>
              <option value="lowest">Menor monto</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ROW 5: TRANSACTIONS LIST CARDS (Exact Match to Mockup Image) */}
      <div className="space-y-2.5">
        {paginatedTransactions.length > 0 ? (
          paginatedTransactions.map((tx) => {
            const visuals = getCategoryVisuals(tx.categoria, tx.tipoTransaccion);
            const Icon = visuals.icon;
            const isExpense = tx.tipoTransaccion !== 'ingreso';
            const payerName = tx.pagadoPor === 'user1' ? user1Name : user2Name;
            const payerInitial = (payerName || 'U').charAt(0).toUpperCase();
            const isPayerUser1 = tx.pagadoPor === 'user1';
            const friendlyDate = formatFriendlyDate(tx.fecha, tx.hora);
            const isInstallment = Boolean(tx.esCuotas || (tx.cuotasTotal && tx.cuotasTotal > 1));

            return (
              <div
                key={tx.id}
                onClick={() => handleEdit(tx)}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 p-3.5 sm:p-4 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 group cursor-pointer"
              >
                
                {/* LEFT: Category Icon + (Concept + Category Badge + Date • Payer) */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${visuals.bg} ${visuals.text} ${visuals.border} shadow-2xs`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    {/* Concept */}
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate group-hover:text-[#6F2EC5] transition-colors">
                      {tx.concepto || 'Sin concepto'}
                    </h4>

                    {/* Category Pill Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${visuals.badgeBg}`}>
                        {tx.categoria || 'General'}
                      </span>

                      {isInstallment && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <CreditCard className="w-2.5 h-2.5" />
                          <span>Cuota {tx.cuotaActual || 1}/{tx.cuotasTotal || 1}</span>
                        </span>
                      )}
                    </div>

                    {/* Date and Payer separated by bullet (Visible on mobile and desktop) */}
                    <p className="text-xs text-slate-400 font-medium pt-0.5 flex items-center gap-1.5">
                      <span>{friendlyDate}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-semibold">{payerName}</span>
                    </p>
                  </div>
                </div>

                {/* RIGHT: Amount/Method + Payer Avatar Circle + Chevron */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                  
                  {/* Amount & Payment Method */}
                  <div className="text-right">
                    <p className={`font-black text-sm sm:text-base tracking-tight ${
                      isExpense ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {isExpense 
                        ? `- $ ${Math.abs(tx.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` 
                        : `+$ ${Math.abs(tx.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate max-w-[95px] sm:max-w-[130px]">
                      {tx.metodoPago || 'Tarjeta'}
                    </p>
                  </div>

                  {/* Payer Avatar Circle ("S" purple, "L" orange) */}
                  <div
                    className={`w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                      isPayerUser1 ? 'bg-[#6F2EC5]' : 'bg-[#F95420]'
                    }`}
                    title={`Pagado por: ${payerName}`}
                  >
                    {payerInitial}
                  </div>

                  {/* Chevron Right */}
                  <div className="text-slate-300 group-hover:text-[#6F2EC5] transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>

                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">No se encontraron transacciones con los filtros seleccionados</p>
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-1.5 bg-purple-50 text-[#6F2EC5] text-xs font-bold rounded-xl hover:bg-purple-100 transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {/* ROW 6: PAGINATION & 'VER MÁS MOVIMIENTOS >' FOOTER */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-1">
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5 justify-center">
            {/* Previous button */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#6F2EC5] text-white shadow-xs'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            {totalPages > 5 && (
              <>
                <span className="text-slate-400 text-xs px-1">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-[#6F2EC5] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next button */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Link: Ver más movimientos > */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(p => p + 1);
                } else {
                  onFilterChange({ dateRange: 'all', search: '', categoria: 'ALL' });
                }
              }}
              className="text-xs sm:text-sm font-bold text-[#6F2EC5] hover:text-[#5B21B6] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver más movimientos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
