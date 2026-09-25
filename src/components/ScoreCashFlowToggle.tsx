import React, { useState } from "react";
import {
  Gauge,
  WalletCards,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type ScoreData = {
  score: number;
  label: string;
  detail?: string;
};

type CashFlowData = {
  income: number;
  expenses: number;
  balance: number;
  currency?: string;
};

type Props = {
  score?: ScoreData;
  cashFlow?: CashFlowData;
};

const ORANGE = "#F95420";
const PURPLE = "#9333EA";

const money = (value: number, currency = "$") =>
  `${currency} ${Math.abs(value).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export default function ScoreCashFlowToggle({
  score = {
    score: 78,
    label: "Buen control",
    detail: "Tu comportamiento financiero este mes",
  },
  cashFlow = {
    income: 1500000,
    expenses: 1180000,
    balance: 320000,
    currency: "$",
  },
}: Props) {
  const [open, setOpen] = useState<"score" | "cashflow" | null>(null);

  const toggle = (section: "score" | "cashflow") =>
    setOpen((current) => (current === section ? null : section));

  const positive = cashFlow.balance >= 0;

  return (
    <section className="w-full">
      {/* Botones: siempre uno al lado del otro */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => toggle("score")}
          aria-expanded={open === "score"}
          className="group rounded-2xl border border-purple-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#9333EA]">
              <Gauge size={19} />
            </span>
            <ChevronDown
              size={17}
              className={`text-slate-400 transition ${
                open === "score" ? "rotate-180" : ""
              }`}
            />
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            Score financiero
          </p>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {score.score}
            </span>
            <span className="mb-1 text-xs text-slate-400">/100</span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-[#9333EA]">
            {score.label}
          </p>
        </button>

        <button
          type="button"
          onClick={() => toggle("cashflow")}
          aria-expanded={open === "cashflow"}
          className="group rounded-2xl border border-orange-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#F95420]">
              <WalletCards size={19} />
            </span>
            <ChevronDown
              size={17}
              className={`text-slate-400 transition ${
                open === "cashflow" ? "rotate-180" : ""
              }`}
            />
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            Flujo de caja
          </p>
          <div className="mt-1 flex items-end gap-1">
            <span
              className={`text-xl font-bold ${
                positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {positive ? "+" : "-"}
              {money(cashFlow.balance, cashFlow.currency)}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {positive ? "Saldo positivo" : "Saldo negativo"}
          </p>
        </button>
      </div>

      {/* Panel Score */}
      {open === "score" && (
        <div className="mt-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Tu score financiero
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {score.detail || "Resumen de tu comportamiento financiero."}
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#9333EA]/20">
              <span className="text-lg font-bold text-[#9333EA]">
                {score.score}
              </span>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-purple-100">
            <div
              className="h-full rounded-full bg-[#9333EA] transition-all"
              style={{ width: `${Math.min(100, Math.max(0, score.score))}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            El score se muestra como referencia para ayudarte a seguir tu
            evolución financiera.
          </p>
        </div>
      )}

      {/* Panel Flujo de caja */}
      {open === "cashflow" && (
        <div className="mt-3 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Flujo de caja del período
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ingresos menos egresos registrados.
              </p>
            </div>
            {positive ? (
              <TrendingUp className="text-emerald-600" size={20} />
            ) : (
              <TrendingDown className="text-red-500" size={20} />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <ArrowUpRight size={14} className="text-emerald-600" />
                Ingresos
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {money(cashFlow.income, cashFlow.currency)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <ArrowDownRight size={14} className="text-[#F95420]" />
                Egresos
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {money(cashFlow.expenses, cashFlow.currency)}
              </p>
            </div>
          </div>

          <div
            className={`mt-2 flex items-center justify-between rounded-xl px-3 py-3 ${
              positive ? "bg-emerald-50" : "bg-red-50"
            }`}
          >
            <span className="text-xs font-semibold text-slate-600">
              Resultado
            </span>
            <span
              className={`text-sm font-bold ${
                positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {positive ? "+" : "-"}
              {money(cashFlow.balance, cashFlow.currency)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
