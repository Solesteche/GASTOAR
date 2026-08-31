import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Building2, 
  Store, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  Check, 
  Lock, 
  ExternalLink,
  ChevronRight,
  BadgePercent
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BillingCycle, MercadoPagoPaymentDetails, SubscriptionPlan } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  billingCycle: BillingCycle;
  userEmail?: string;
  userName?: string;
  accountCode?: string;
  onPaymentSuccess: (details: {
    planId: string;
    planName: string;
    billingCycle: BillingCycle;
    paymentId: string;
    amount: number;
  }) => void;
}

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  userEmail = '',
  userName = '',
  accountCode = '',
  onPaymentSuccess,
}) => {
  if (!isOpen || !plan) return null;

  const [paymentMethod, setPaymentMethod] = useState<'account_money' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'ticket'>('account_money');
  const [payerEmail, setPayerEmail] = useState<string>(userEmail || 'usuario@ejemplo.com');
  const [payerName, setPayerName] = useState<string>(userName || 'Usuario GastoAR');
  const [payerDni, setPayerDni] = useState<string>('38492104');
  
  // Card state
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/29');
  const [cardCvv, setCardCvv] = useState<string>('842');
  const [cardInstallments, setCardInstallments] = useState<number>(1);
  
  // Status states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentApproved, setPaymentApproved] = useState<boolean>(false);
  const [approvedDetails, setApprovedDetails] = useState<MercadoPagoPaymentDetails | null>(null);
  const [copiedAlias, setCopiedAlias] = useState<boolean>(false);

  const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const savings = billingCycle === 'annual' ? (plan.priceMonthly * 12) - plan.priceAnnual : 0;

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    try {
      // Call server endpoint
      const response = await fetch('/api/mercadopago/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price,
          billingCycle,
          userEmail: payerEmail,
          userName: payerName,
          paymentMethodId: paymentMethod,
          cardLastFour: cardNumber.replace(/\s+/g, '').slice(-4) || '4242',
        }),
      });

      const data = await response.json();

      // Simulate a realistic gateway delay (1.2s)
      setTimeout(() => {
        setIsProcessing(false);
        if (data.success && data.payment) {
          setPaymentApproved(true);
          setApprovedDetails(data.payment);

          // Trigger victory confetti
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#009EE3', '#002B49', '#10B981', '#F59E0B']
            });
          } catch {}

          onPaymentSuccess({
            planId: plan.id,
            planName: plan.name,
            billingCycle,
            paymentId: data.payment.paymentId,
            amount: price,
          });
        }
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleCopyAlias = () => {
    navigator.clipboard.writeText('gastoar.mp');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Mercado Pago Branded Top Bar */}
        <div className="bg-gradient-to-r from-[#009EE3] to-[#007EB5] px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {/* Mercado Pago Icon & Badge */}
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg text-white border border-white/30 shadow-inner">
              <span className="tracking-tighter">MP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight leading-none text-white">
                  Mercado Pago
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider text-white">
                  Checkout Seguro
                </span>
              </div>
              <p className="text-sky-100 text-xs mt-0.5">
                Procesamiento instantáneo y protección al comprador
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* SUCCESS SCREEN */}
          {paymentApproved && approvedDetails ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  ¡Pago Aprobado con Éxito!
                </h4>
                <p className="text-sm text-slate-600">
                  Tu suscripción a <strong className="text-slate-900 font-bold">{plan.name}</strong> ha sido acreditada y activada.
                </p>
              </div>

              {/* Receipt Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-xs max-w-md mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-700">
                  <span>Comprobante Mercado Pago</span>
                  <span className="text-[#009EE3] font-mono">{approvedDetails.paymentId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Plan:</span>
                  <strong className="text-slate-900">{plan.name} ({billingCycle === 'annual' ? 'Anual' : 'Mensual'})</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total abonado:</span>
                  <strong className="text-slate-900 font-bold text-sm">{formatCurrency(approvedDetails.transactionAmount, 'ARS')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Titular de la cuenta:</span>
                  <span className="text-slate-900">{payerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fecha de acreditación:</span>
                  <span className="text-slate-900">{new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estado:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Acreditado al instante
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#009EE3] hover:bg-[#0089C7] text-white font-black text-sm shadow-lg shadow-[#009EE3]/30 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Comenzar a usar mi Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Summary Badge Card */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{plan.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold">
                      {billingCycle === 'annual' ? 'Facturación Anual' : 'Facturación Mensual'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{plan.tagline}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-xl font-black text-[#009EE3]">
                    {formatCurrency(price, 'ARS')}
                  </div>
                  {savings > 0 && (
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                      <BadgePercent className="w-3 h-3" />
                      <span>Ahorras {formatCurrency(savings, 'ARS')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selecciona cómo querés pagar con Mercado Pago:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Dinero en cuenta MP */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('account_money')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === 'account_money'
                        ? 'border-[#009EE3] bg-sky-50/60 ring-2 ring-[#009EE3]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Smartphone className={`w-5 h-5 mb-2 ${paymentMethod === 'account_money' ? 'text-[#009EE3]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">Dinero en MP</div>
                      <div className="text-[10px] text-slate-500">Saldo o Débito</div>
                    </div>
                  </button>

                  {/* Tarjeta de Crédito */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === 'credit_card'
                        ? 'border-[#009EE3] bg-sky-50/60 ring-2 ring-[#009EE3]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 mb-2 ${paymentMethod === 'credit_card' ? 'text-[#009EE3]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">Tarjeta</div>
                      <div className="text-[10px] text-slate-500">Crédito / Débito</div>
                    </div>
                  </button>

                  {/* Transferencia / CVU */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#009EE3] bg-sky-50/60 ring-2 ring-[#009EE3]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 mb-2 ${paymentMethod === 'bank_transfer' ? 'text-[#009EE3]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">Transferencia</div>
                      <div className="text-[10px] text-slate-500">CVU / DEBIN</div>
                    </div>
                  </button>

                  {/* Efectivo */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ticket')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === 'ticket'
                        ? 'border-[#009EE3] bg-sky-50/60 ring-2 ring-[#009EE3]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Store className={`w-5 h-5 mb-2 ${paymentMethod === 'ticket' ? 'text-[#009EE3]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">Efectivo</div>
                      <div className="text-[10px] text-slate-500">Pago Fácil/Rapi</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* PAYMENT DETAILS FORM ACCORDING TO METHOD */}
              
              {/* Option 1: Dinero en cuenta / QR Mercado Pago */}
              {paymentMethod === 'account_money' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[#009EE3] shadow-xs">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        Pago instantáneo con cuenta de Mercado Pago
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        Podés abonar con tu dinero disponible, tarjeta guardada o débito automático.
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Usuario pagador:</span>
                    <strong className="text-slate-900">{payerEmail}</strong>
                  </div>
                </div>
              )}

              {/* Option 2: Tarjetas */}
              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Número de Tarjeta
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• 4242"
                        className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#009EE3] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Vencimiento
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#009EE3] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        CVV (Código)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-[#009EE3] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Cuotas
                    </label>
                    <select
                      value={cardInstallments}
                      onChange={(e) => setCardInstallments(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#009EE3] focus:outline-none"
                    >
                      <option value={1}>1 pago de {formatCurrency(price, 'ARS')} (Sin interés)</option>
                      <option value={3}>3 cuotas de {formatCurrency(price / 3, 'ARS')}</option>
                      <option value={6}>6 cuotas de {formatCurrency(price / 6, 'ARS')}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Option 3: Transferencia CVU */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="space-y-1 text-xs text-slate-700">
                    <div className="font-bold text-slate-900">Datos para transferir por CVU/Alias Mercado Pago:</div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Alias MP:</span>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-[#009EE3] text-sm">gastoar.mp</strong>
                          <button
                            type="button"
                            onClick={handleCopyAlias}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                            title="Copiar Alias"
                          >
                            {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Titular:</span>
                        <strong className="text-slate-900">GastoAR S.R.L.</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Monto exacto:</span>
                        <strong className="text-slate-900 text-sm">{formatCurrency(price, 'ARS')}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 4: Efectivo Ticket */}
              {paymentMethod === 'ticket' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">Abonar en sucursales de Pago Fácil o Rapipago:</div>
                  <p className="text-slate-600 leading-relaxed">
                    Al confirmar, se generará el código de barras y cupón digital de Mercado Pago para abonar en cualquier sucursal en efectivo.
                  </p>
                </div>
              )}

              {/* Payer Email & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Correo para el recibo
                  </label>
                  <input
                    type="email"
                    required
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#009EE3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    DNI / CUIT del titular
                  </label>
                  <input
                    type="text"
                    required
                    value={payerDni}
                    onChange={(e) => setPayerDni(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#009EE3] focus:outline-none"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pago encriptado SSL de 256 bits procesado directamente por Mercado Pago Argentina.</span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#009EE3] hover:bg-[#0089C7] active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#009EE3]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Procesando pago con Mercado Pago...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pagar {formatCurrency(price, 'ARS')} con Mercado Pago</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>GastoAR &bull; Planes Oficiales</span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Lock className="w-3 h-3 text-emerald-600" /> Mercado Pago Argentina
          </span>
        </div>

      </div>
    </div>
  );
};
