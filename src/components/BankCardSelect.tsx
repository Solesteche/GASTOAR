import React, { useState } from 'react';
import { CreditCard, Search, Sparkles } from 'lucide-react';
import { 
  ARGENTINE_BANKS_AND_CARDS, 
  BANK_CATEGORIES_LABEL, 
  POPULAR_QUICK_CARDS,
  BankOrCard
} from '../data/argentineBanks';

interface BankCardSelectProps {
  value: string;
  onChange: (cardName: string) => void;
  label?: string;
  showQuickChips?: boolean;
}

export const BankCardSelect: React.FC<BankCardSelectProps> = ({
  value,
  onChange,
  label = 'Tarjeta / Banco / Billetera Virtual (Argentina)',
  showQuickChips = true,
}) => {
  const [isCustom, setIsCustom] = useState(() => {
    return value && !ARGENTINE_BANKS_AND_CARDS.some(b => b.name === value || b.shortName === value);
  });

  // Group banks by category
  const groupedBanks = React.useMemo<Record<string, BankOrCard[]>>(() => {
    const groups: Record<string, BankOrCard[]> = {
      fintech: [],
      digital: [],
      privado: [],
      publico_provincial: [],
      tarjeta_comercial: [],
    };

    ARGENTINE_BANKS_AND_CARDS.forEach(bank => {
      if (groups[bank.category]) {
        groups[bank.category].push(bank);
      }
    });

    return groups;
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CUSTOM__') {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}

      {/* Quick shortcuts for most used Argentine cards */}
      {showQuickChips && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Accesos rápidos populares:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
            {POPULAR_QUICK_CARDS.map((card) => {
              const isSelected = value === card;
              const isNaranja = card.includes('Naranja');
              const isMP = card.includes('Mercado Pago');

              return (
                <button
                  key={card}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    onChange(card);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1 ${
                    isSelected
                      ? isNaranja 
                        ? 'bg-orange-500 text-white border-orange-600 shadow-2xs font-bold'
                        : isMP
                        ? 'bg-sky-500 text-white border-sky-600 shadow-2xs font-bold'
                        : 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : isNaranja
                      ? 'bg-orange-50/80 text-orange-800 border-orange-200 hover:bg-orange-100'
                      : isMP
                      ? 'bg-sky-50/80 text-sky-800 border-sky-200 hover:bg-sky-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-3 h-3 shrink-0" />
                  <span>{card}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete select dropdown with optgroups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative">
          <select
            value={isCustom ? '__CUSTOM__' : value}
            onChange={handleSelectChange}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="" disabled>-- Seleccionar banco o tarjeta de Argentina --</option>

            {(Object.entries(groupedBanks) as [string, BankOrCard[]][]).map(([categoryKey, banks]) => (
              <optgroup 
                key={categoryKey} 
                label={BANK_CATEGORIES_LABEL[categoryKey] || categoryKey}
                className="font-bold text-indigo-900 bg-slate-100"
              >
                {banks.map((bank) => (
                  <option 
                    key={bank.id} 
                    value={bank.name}
                    className="font-normal text-slate-800 bg-white py-1"
                  >
                    {bank.name}
                  </option>
                ))}
              </optgroup>
            ))}

            <optgroup label="Otra Entidad / Personalizado" className="font-bold text-slate-700 bg-slate-100">
              <option value="__CUSTOM__" className="text-slate-900 bg-white font-semibold">
                ➕ Otra tarjeta o entidad bancaria...
              </option>
            </optgroup>
          </select>
        </div>

        {/* Input for custom card or direct typing */}
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setIsCustom(true);
              onChange(e.target.value);
            }}
            placeholder="O escribe el nombre de la tarjeta / banco..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>
    </div>
  );
};
