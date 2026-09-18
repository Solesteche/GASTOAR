import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  Volume2,
  FileAudio,
  ShoppingBag,
  Info,
  Calendar,
  CreditCard,
  Users,
  RotateCcw,
  TrendingUp,
  Target,
  DollarSign,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Budgets, CategoryMap, CoupleProfile, Transaction, Goal, GoalContribution, TransactionConfidence } from '../types';
import { formatCurrency } from '../utils/formatters';
import { parseVoiceExpenseLocally, parseSpanishNumberWords, ParsedVoiceExpense } from '../utils/voiceExpenseParser';
import { getLearnedPreferences, recordLearnedPreference } from '../utils/learnedPreferences';
import { LearnedPreferencesModal } from './LearnedPreferencesModal';

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Partial<Transaction>) => void;
  categoryMap: CategoryMap;
  profile: CoupleProfile;
  transactions: Transaction[];
  budgets: Budgets;
  goals?: Goal[];
  onAddGoal?: (goalData: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  onAddGoalContribution?: (goalId: string, contribution: Omit<GoalContribution, 'id'>) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const COMMON_CREDIT_CARDS = [
  'Visa',
  'Mastercard',
  'Naranja X',
  'Visa Santander',
  'Mastercard BBVA',
  'Visa Galicia',
  'Banco Macro',
  'Mercado Pago',
  'American Express'
];

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categoryMap,
  profile,
  goals = [],
  onAddGoal,
  onAddGoalContribution,
  onShowToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [parsedExpense, setParsedExpense] = useState<ParsedVoiceExpense | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Confidence state & confirmation tracking
  const [confidence, setConfidence] = useState<TransactionConfidence>({
    amount: 1,
    category: 1,
    paymentMethod: 1,
    installments: 1
  });
  const [confirmedFields, setConfirmedFields] = useState<{ [key: string]: boolean }>({});

  // Editable fields for parsed result
  const [editTipoOperacion, setEditTipoOperacion] = useState<'gasto' | 'ingreso' | 'meta'>('gasto');
  const [editConcepto, setEditConcepto] = useState('');
  const [editMonto, setEditMonto] = useState<number>(0);
  const [editCategoria, setEditCategoria] = useState('');
  const [editSubcategoria, setEditSubcategoria] = useState('');
  const [editTipoGasto, setEditTipoGasto] = useState<'individual' | 'pareja'>('individual');
  const [editMetodoPago, setEditMetodoPago] = useState('Débito');
  const [editTarjetaNombre, setEditTarjetaNombre] = useState('Visa');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [showLearnedPreferences, setShowLearnedPreferences] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Sync state when parsedExpense changes
  useEffect(() => {
    if (parsedExpense) {
      const op = parsedExpense.tipoOperacion || 'gasto';
      setEditTipoOperacion(op);
      setEditConcepto(parsedExpense.concepto);
      setEditMonto(parsedExpense.monto);
      setEditCategoria(parsedExpense.categoria);
      setEditSubcategoria(parsedExpense.subcategoria);
      setEditTipoGasto(parsedExpense.tipoGasto);
      setEditMetodoPago(parsedExpense.metodoPago || 'Débito');
      
      if (parsedExpense.tarjetaNombre) {
        setEditTarjetaNombre(parsedExpense.tarjetaNombre);
      } else if (!editTarjetaNombre) {
        setEditTarjetaNombre('Visa');
      }

      // Sync confidence scores
      if (parsedExpense.confidence) {
        setConfidence(parsedExpense.confidence);
      } else {
        setConfidence({
          amount: parsedExpense.monto > 0 ? 0.99 : 0.35,
          category: 0.95,
          paymentMethod: 0.35,
          installments: 0.98
        });
      }
      setConfirmedFields({});

      // Try matching goal if meta
      if (op === 'meta' && goals.length > 0) {
        const query = (parsedExpense.metaNombre || '').toLowerCase().trim();
        const matched = query ? goals.find(g => g.nombre.toLowerCase().includes(query) || query.includes(g.nombre.toLowerCase())) : null;
        if (matched) {
          setSelectedGoalId(matched.id);
        } else {
          setSelectedGoalId(goals[0].id);
        }
      } else if (goals.length > 0 && !selectedGoalId) {
        setSelectedGoalId(goals[0].id);
      }
    }
  }, [parsedExpense, goals]);

  if (!isOpen) return null;

  // Process text using local parser with fallback/enhancement from server Gemini
  const processSpokenExpense = async (text: string, audioBase64?: string, mimeType?: string) => {
    if (!text.trim() && !audioBase64) {
      onShowToast('No se detectó voz o audio para procesar.', 'error');
      return;
    }

    setIsProcessing(true);
    setTranscript(text);

    // 1. Instant local parser using user's learned preferences and existing goals
    const learnedPrefs = getLearnedPreferences();
    const existingGoalsPayload = goals.map(g => ({ id: g.id, nombre: g.nombre }));
    const localResult = parseVoiceExpenseLocally(
      text,
      categoryMap,
      profile.currentUser,
      learnedPrefs,
      existingGoalsPayload
    );
    setParsedExpense(localResult);

    // 2. Query server-side Gemini API for deep semantic recognition or audio processing
    try {
      const payload: any = {
        textPrompt: text.trim() || undefined,
        audioBase64,
        mimeType: mimeType || 'audio/webm',
        availableCategories: Object.keys(categoryMap),
        categoryMap,
        userNames: [profile.user1Name, profile.user2Name],
        learnedPreferences: learnedPrefs,
        existingGoals: existingGoalsPayload,
      };

      const response = await fetch('/api/gemini/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const geminiData = data.data;
          
          // Verify valid category - if local parser matched a learned preference, prioritize the learned preference
          let cat = categoryMap[geminiData.categoria] ? geminiData.categoria : localResult.categoria;
          let sub = categoryMap[cat]?.includes(geminiData.subcategoria) 
            ? geminiData.subcategoria 
            : (categoryMap[cat]?.[0] || 'General');

          if (localResult.learnedPreferenceApplied) {
            cat = localResult.categoria;
            sub = localResult.subcategoria;
          }

          // Also guarantee that references to Dia supermarket are always mapped to Alimentación & Bebidas
          const combinedLower = ((geminiData.transcripcion || text || '') + ' ' + (geminiData.concepto || '')).toLowerCase();
          const isDiaMention = /\b(?:en\s+)?d[ií]a\b/i.test(combinedLower) ||
            combinedLower.includes('supermercado dia') ||
            combinedLower.includes('supermercado día');

          const opType = geminiData.tipoOperacion || localResult.tipoOperacion || 'gasto';

          if (isDiaMention) {
            cat = categoryMap['Alimentación & Bebidas'] ? 'Alimentación & Bebidas' : (Object.keys(categoryMap)[0] || 'Alimentación & Bebidas');
            const foundSub = categoryMap[cat]?.find(s => s.toLowerCase().includes('supermercado')) || categoryMap[cat]?.[0] || 'Supermercado & Hipermercado';
            sub = foundSub;
          }

          const isDeliveryMention = 
            combinedLower.includes('delivery') ||
            combinedLower.includes('pedidosya') ||
            combinedLower.includes('pedidos ya') ||
            combinedLower.includes('rappi') ||
            combinedLower.includes('helado') ||
            combinedLower.includes('heladeria') ||
            combinedLower.includes('heladería') ||
            combinedLower.includes('pizzeria') ||
            combinedLower.includes('pizzería') ||
            combinedLower.includes('pizza') ||
            combinedLower.includes('empanada') ||
            combinedLower.includes('empanadas') ||
            combinedLower.includes('sushi');

          if (isDeliveryMention && opType === 'gasto') {
            cat = categoryMap['Alimentación & Bebidas'] ? 'Alimentación & Bebidas' : (Object.keys(categoryMap)[0] || 'Alimentación & Bebidas');
            const foundDelivery = categoryMap[cat]?.find(s => s.toLowerCase().includes('delivery')) || 'Delivery (PedidosYa / Rappi)';
            sub = foundDelivery;
          }

          // Determine best, most accurate Argentine monto (prevent 11000 turning into 11, or 50000 into 50)
          let finalMonto = localResult.monto;
          const returnedMonto = typeof geminiData.monto === 'number' ? geminiData.monto : 0;
          
          // Re-evaluate transcription returned by Gemini or audio
          const transcriptionText = (geminiData.transcripcion || text || '').trim();
          const parsedFromTranscript = parseSpanishNumberWords(transcriptionText);

          if (parsedFromTranscript && parsedFromTranscript >= 1000) {
            finalMonto = parsedFromTranscript;
          } else if (returnedMonto >= 1000) {
            finalMonto = returnedMonto;
          } else if (returnedMonto > 0 && returnedMonto < 1000) {
            if (localResult.monto >= 1000) {
              finalMonto = localResult.monto;
            } else if (returnedMonto === 11) {
              finalMonto = 11000;
            } else if (returnedMonto === 50) {
              finalMonto = 50000;
            } else if (returnedMonto <= 150) {
              finalMonto = returnedMonto * 1000;
            } else {
              finalMonto = returnedMonto;
            }
          } else if (localResult.monto > 0) {
            finalMonto = localResult.monto;
          }

          const mergedConfidence: TransactionConfidence = geminiData.confidence || localResult.confidence || {
            amount: finalMonto > 0 ? 0.99 : 0.35,
            category: opType !== 'gasto' || localResult.learnedPreferenceApplied ? 1.0 : 0.95,
            paymentMethod: opType === 'meta' ? 1.0 : (geminiData.metodoPago ? 0.95 : 0.35),
            installments: 0.98,
          };

          if (localResult.learnedPreferenceApplied) {
            mergedConfidence.category = 1.0;
          }

          const mergedUnconfirmedFields = geminiData.unconfirmedFields || localResult.unconfirmedFields || [];
          const mergedConfirmationQuestion = geminiData.confirmationQuestion || localResult.confirmationQuestion;

          setParsedExpense({
            transcripcion: geminiData.transcripcion || text,
            concepto: isDiaMention ? 'Supermercado Día' : (geminiData.concepto || localResult.concepto),
            descripcion: geminiData.descripcion || localResult.descripcion,
            monto: finalMonto,
            categoria: cat,
            subcategoria: sub,
            tipoGasto: geminiData.tipoGasto === 'pareja' ? 'pareja' : 'individual',
            division: geminiData.tipoGasto === 'pareja' ? '50_50' : undefined,
            metodoPago: geminiData.metodoPago || localResult.metodoPago || 'Débito',
            tarjetaNombre: geminiData.tarjetaNombre || localResult.tarjetaNombre,
            tipoOperacion: opType,
            metaNombre: geminiData.metaNombre || localResult.metaNombre,
            fecha: new Date().toISOString().split('T')[0],
            confidence: mergedConfidence,
            unconfirmedFields: mergedUnconfirmedFields,
            confirmationQuestion: mergedConfirmationQuestion,
            learnedPreferenceApplied: localResult.learnedPreferenceApplied,
            learnedRule: localResult.learnedRule,
          });

          if (opType === 'meta') {
            onShowToast('🎯 ¡Aporte a meta de ahorro interpretado con éxito!', 'success');
          } else if (opType === 'ingreso') {
            onShowToast('💵 ¡Ingreso de dinero interpretado con éxito!', 'success');
          } else {
            onShowToast('¡Gasto interpretado con éxito por voz!', 'success');
          }
        }
      } else {
        const opType = localResult.tipoOperacion || 'gasto';
        if (opType === 'meta') onShowToast('🎯 Aporte a meta interpretado por reconocimiento de voz.', 'success');
        else if (opType === 'ingreso') onShowToast('💵 Ingreso interpretado por reconocimiento de voz.', 'success');
        else onShowToast('Gasto interpretado por reconocimiento de voz.', 'success');
      }
    } catch {
      const opType = localResult.tipoOperacion || 'gasto';
      if (opType === 'meta') onShowToast('🎯 Aporte a meta interpretado por reconocimiento de voz.', 'success');
      else if (opType === 'ingreso') onShowToast('💵 Ingreso interpretado por reconocimiento de voz.', 'success');
      else onShowToast('Gasto interpretado por reconocimiento de voz.', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start / Stop Microphone Listening
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Tu navegador no soporta dictado directo. Podés subir una nota de audio o probar los ejemplos.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setAudioFileName(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultText = event.results[current][0].transcript;
        setTranscript(resultText);

        if (event.results[current].isFinal) {
          processSpokenExpense(resultText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          onShowToast('Permiso de micrófono denegado. Habilitalo en tu navegador.', 'error');
        } else if (event.error !== 'no-speech') {
          onShowToast(`Error de audio: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      onShowToast('No se pudo iniciar el micrófono.', 'error');
    }
  };

  // Handle uploaded audio file (WhatsApp audio, voice note, etc.)
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const mimeType = file.type || 'audio/mp3';

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      processSpokenExpense(`Audio: ${file.name}`, base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  // Preset example click
  const handleSelectExample = (examplePhrase: string) => {
    setTranscript(examplePhrase);
    setAudioFileName(null);
    processSpokenExpense(examplePhrase);
  };

  // Confirm and Save to App State (Expense, Income or Goal Contribution)
  const handleSaveExpense = () => {
    if (!editMonto || editMonto <= 0) {
      onShowToast('Por favor ingresá o confirmá un monto válido.', 'error');
      return;
    }

    const isPareja = editTipoGasto === 'pareja';
    const todayStr = new Date().toISOString().split('T')[0];

    // Case 1: Aporte a Meta de Ahorro
    if (editTipoOperacion === 'meta') {
      let targetGoal = goals.find(g => g.id === selectedGoalId);
      if (!targetGoal && parsedExpense?.metaNombre) {
        const q = parsedExpense.metaNombre.toLowerCase().trim();
        targetGoal = goals.find(g => g.nombre.toLowerCase().includes(q) || q.includes(g.nombre.toLowerCase()));
      }
      if (!targetGoal && goals.length > 0) {
        targetGoal = goals[0];
      }

      // If no goal exists at all, auto-create one if onAddGoal is available
      if (!targetGoal && onAddGoal) {
        const autoGoalName = parsedExpense?.metaNombre ? `Fondo ${parsedExpense.metaNombre}` : 'Fondo de Ahorro';
        targetGoal = onAddGoal({
          nombre: autoGoalName,
          categoria: 'Viajes & Vacaciones',
          montoObjetivo: editMonto * 2 > 200000 ? editMonto * 2 : 200000,
          montoActual: 0,
          fechaLimite: '',
          color: '#3B82F6',
          icono: 'Target',
          responsable: 'ambos',
          prioridad: 'media',
          activa: true,
        });
      }

      if (!targetGoal) {
        onShowToast('No se encontró una meta para asignar el aporte. Creá una meta en la solapa Metas.', 'error');
        return;
      }

      if (onAddGoalContribution) {
        onAddGoalContribution(targetGoal.id, {
          monto: editMonto,
          fecha: todayStr,
          nota: transcript ? `Dictado por voz: "${transcript}"` : 'Aporte por voz',
          tipo: 'aporte',
        });
      }

      // Also record transaction so it is reflected in balances
      onAddTransaction({
        concepto: editConcepto || `Aporte a meta "${targetGoal.nombre}"`,
        descripcion: transcript ? `Dictado por voz: "${transcript}"` : `Aporte a fondo de ahorro "${targetGoal.nombre}"`,
        monto: editMonto,
        moneda: profile.currency || 'ARS',
        categoria: 'Ahorro',
        subcategoria: 'Metas & Fondos',
        fecha: todayStr,
        tipo: isPareja ? 'pareja' : 'individual',
        tipoTransaccion: 'gasto',
        pagadoPor: profile.currentUser,
        splitType: isPareja ? '50_50' : undefined,
        metodoPago: editMetodoPago as any,
        tarjetaNombre: editMetodoPago === 'Crédito' ? editTarjetaNombre : undefined,
        inputMethod: 'audio',
        audioTranscription: (transcript || parsedExpense?.transcripcion || 'Aporte por voz').trim(),
        confidence: {
          amount: confidence.amount,
          category: confidence.category,
          paymentMethod: confirmedFields.paymentMethod ? 1.0 : confidence.paymentMethod,
          installments: confidence.installments,
        },
      });

      onShowToast(`🎉 ¡Se agregaron $${editMonto.toLocaleString('es-AR')} a la meta "${targetGoal.nombre}"!`, 'success');
      handleReset();
      onClose();
      return;
    }

    // Case 2: Registro de Ingreso
    if (editTipoOperacion === 'ingreso') {
      onAddTransaction({
        concepto: editConcepto.trim() || 'Ingreso por Voz',
        descripcion: transcript ? `Dictado por voz: "${transcript}"` : 'Ingreso registrado por voz',
        monto: editMonto,
        moneda: profile.currency || 'ARS',
        categoria: 'Ingresos',
        subcategoria: editSubcategoria || 'Sueldo',
        fecha: todayStr,
        tipo: isPareja ? 'pareja' : 'individual',
        tipoTransaccion: 'ingreso',
        pagadoPor: profile.currentUser,
        metodoPago: editMetodoPago as any,
        inputMethod: 'audio',
        audioTranscription: (transcript || parsedExpense?.transcripcion || 'Ingreso registrado por voz').trim(),
        confidence: {
          amount: confidence.amount,
          category: confidence.category,
          paymentMethod: confirmedFields.paymentMethod ? 1.0 : confidence.paymentMethod,
          installments: confidence.installments,
        },
      });

      onShowToast(`💵 ¡Ingreso de $${editMonto.toLocaleString('es-AR')} guardado con éxito!`, 'success');
      handleReset();
      onClose();
      return;
    }

    // Case 3: Registro de Gasto
    // Automatically record and reinforce user's learned preference for this merchant & category
    const cleanConcepto = editConcepto.trim();
    let learnedRuleId = parsedExpense?.learnedRule?.id;
    if (cleanConcepto && cleanConcepto !== 'Gasto por voz') {
      const updatedPrefs = recordLearnedPreference(
        cleanConcepto,
        editCategoria,
        editSubcategoria || 'General',
        editMetodoPago as any,
        'auto_learned'
      );
      const matchedRule = updatedPrefs.find(p => p.merchantName.toLowerCase() === cleanConcepto.toLowerCase());
      if (matchedRule) {
        learnedRuleId = matchedRule.id;
      }
    }

    onAddTransaction({
      concepto: cleanConcepto || 'Gasto por Voz',
      descripcion: transcript ? `Dictado por voz: "${transcript}"` : 'Registro rápido por voz',
      monto: editMonto,
      moneda: profile.currency || 'ARS',
      categoria: editCategoria || 'Alimentación & Bebidas',
      subcategoria: editSubcategoria || 'General',
      fecha: todayStr,
      tipo: isPareja ? 'pareja' : 'individual',
      tipoTransaccion: 'gasto',
      pagadoPor: profile.currentUser,
      splitType: isPareja ? '50_50' : undefined,
      metodoPago: editMetodoPago as any,
      tarjetaNombre: editMetodoPago === 'Crédito' ? editTarjetaNombre : undefined,
      inputMethod: 'audio',
      audioTranscription: (transcript || parsedExpense?.transcripcion || 'Gasto registrado por voz').trim(),
      confidence: {
        amount: confidence.amount,
        category: parsedExpense?.learnedPreferenceApplied ? 1.0 : confidence.category,
        paymentMethod: confirmedFields.paymentMethod ? 1.0 : confidence.paymentMethod,
        installments: confidence.installments,
      },
      learnedPreferenceApplied: parsedExpense?.learnedPreferenceApplied || false,
      learnedMerchantId: learnedRuleId,
    });

    const cardInfo = editMetodoPago === 'Crédito' && editTarjetaNombre ? ` con ${editTarjetaNombre}` : '';
    onShowToast(`¡Gasto de $${editMonto.toLocaleString('es-AR')} guardado${cardInfo}!`, 'success');
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedExpense(null);
    setTranscript('');
    setAudioFileName(null);
    setIsListening(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-purple-100">
        
        {/* Hidden Audio File Input for WhatsApp / Audio Notes */}
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.ogg,.opus,.m4a,.wav,.webm"
          onChange={handleAudioUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 text-purple-200 border border-white/20 flex items-center justify-center font-bold shadow-xs">
              <Mic className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight flex items-center gap-1.5 text-white">
                <span>Registro de Gasto por Voz</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-400/30 text-purple-100 rounded-full border border-purple-300/30">
                  IA Automática
                </span>
              </h3>
              <p className="text-[11px] text-purple-200">
                Dictá o enviá un audio y la IA asignará el comercio, monto y categoría
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLearnedPreferences(true)}
              title="Ver y configurar comercios y preferencias aprendidas"
              className="flex items-center gap-1.5 text-xs font-bold text-purple-100 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span className="hidden sm:inline">Comercios aprendidos</span>
              <span className="sm:hidden">Comercios</span>
            </button>
            <button
              onClick={onClose}
              className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Main Voice Interactive Area */}
          <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center">
            
            {/* Big Pulsing Mic Button */}
            <div className="relative mb-3">
              {isListening && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-purple-500/30 animate-ping opacity-75" />
                  <div className="absolute -inset-6 rounded-full bg-purple-400/20 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/50 scale-105 ring-4 ring-rose-300'
                    : isProcessing
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gradient-to-tr from-[#2E0854] via-[#5B21B6] to-[#7928CA] text-white shadow-purple-900/30 hover:scale-105 hover:shadow-purple-700/40'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-9 h-9 animate-spin text-purple-700" />
                ) : isListening ? (
                  <MicOff className="w-9 h-9 sm:w-10 sm:h-10 text-white animate-pulse" />
                ) : (
                  <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                )}
              </button>
            </div>

            {/* Instruction / State Indicator */}
            <div className="space-y-1">
              <p className="font-extrabold text-sm sm:text-base text-slate-800">
                {isListening
                  ? 'Te estoy escuchando... ¡hablá ahora!'
                  : isProcessing
                  ? 'Analizando gasto con inteligencia artificial...'
                  : 'Tocá el micrófono para dictar tu gasto'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {isListening
                  ? 'Ejemplo: "Gasté 50000 en Coto"'
                  : 'Reconoce montos, comercios y categorías automáticamente'}
              </p>
            </div>

            {/* Live Audio / Transcript Preview */}
            {(transcript || audioFileName) && (
              <div className="mt-3.5 w-full p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center gap-2.5 text-left">
                <Volume2 className="w-4 h-4 text-purple-700 shrink-0" />
                <div className="text-xs text-purple-900 font-medium truncate flex-1">
                  <span className="font-bold text-purple-950">Audio detectado: </span>
                  <span className="italic">"{transcript || audioFileName}"</span>
                </div>
                {parsedExpense && (
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reiniciar dictado"
                    className="text-purple-600 hover:text-purple-900 p-1 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PARSED EXPENSE CARD (Highlighted Result) */}
          {parsedExpense ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-white border-2 border-purple-300 shadow-md space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header with Operation Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-extrabold text-xs text-purple-950 uppercase tracking-wide">
                    Operación Detectada
                  </span>
                </div>

                {/* Switcher: Gasto | Ingreso | Meta */}
                <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-xl border border-purple-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setEditTipoOperacion('gasto')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      editTipoOperacion === 'gasto'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🛒 Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipoOperacion('ingreso')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      editTipoOperacion === 'ingreso'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💵 Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipoOperacion('meta')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      editTipoOperacion === 'meta'
                        ? 'bg-[#EA580C] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎯 Meta / Fondo
                  </button>
                </div>
              </div>

              {/* LEARNED PREFERENCE APPLIED BADGE */}
              {parsedExpense.learnedPreferenceApplied && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-100/90 border border-purple-300 text-purple-950 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <span>
                      🧠 <strong>Preferencia aprendida aplicada:</strong> Reconocí <em>"{parsedExpense.learnedRule?.keyword || editConcepto}"</em> y asigné <strong>{editCategoria}</strong> › {editSubcategoria} con 100% de confianza.
                    </span>
                  </div>
                </div>
              )}

              {/* USER REQUESTED CONFIRMATION FLOW (WHEN CONFIDENCE IS LOW IN PAYMENT METHOD, AMOUNT, OR CATEGORY) */}
              {editTipoOperacion === 'gasto' && (
                <div className="space-y-2.5">
                  {/* 1. Payment Method Confirmation Request */}
                  {confidence.paymentMethod < 0.85 && !confirmedFields.paymentMethod && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 shadow-sm space-y-2.5 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center shrink-0 text-amber-950 font-black text-sm">
                          ❓
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider">
                              Confirmación requerida
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                              Confianza en pago: {Math.round(confidence.paymentMethod * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-amber-950 font-semibold mt-1 leading-snug">
                            "{parsedExpense.confirmationQuestion || (
                              editMonto > 0 
                                ? `Entendí $${editMonto.toLocaleString('es-AR')}${editConcepto && editConcepto !== 'Gasto por voz' ? ` en ${editConcepto}` : ''}, pero no pude determinar la forma de pago.`
                                : 'No pude determinar la forma de pago utilizada.'
                            )}"
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/80">
                        <p className="text-[11px] font-black text-amber-950 mb-2 flex items-center gap-1.5">
                          <span className="text-amber-700 font-bold">→</span>
                          <span>¿Cómo pagaste?</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'Efectivo', label: 'Efectivo', icon: '💵' },
                            { id: 'Débito', label: 'Débito', icon: '💳' },
                            { id: 'Crédito', label: 'Crédito', icon: '💳' },
                            { id: 'Transferencia', label: 'Transferencia', icon: '📱' },
                          ].map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => {
                                setEditMetodoPago(method.id);
                                setConfidence(prev => ({ ...prev, paymentMethod: 1.0 }));
                                setConfirmedFields(prev => ({ ...prev, paymentMethod: true }));
                                onShowToast(`Forma de pago confirmada: ${method.id}`, 'success');
                              }}
                              className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 ${
                                editMetodoPago === method.id
                                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                  : 'bg-white text-slate-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
                              }`}
                            >
                              <span>{method.icon}</span>
                              <span>{method.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method confirmed badge */}
                  {confirmedFields.paymentMethod && (
                    <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Forma de pago confirmada: <strong className="text-emerald-950 font-bold">{editMetodoPago}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmedFields(prev => ({ ...prev, paymentMethod: false }))}
                        className="text-[10px] text-emerald-700 hover:text-emerald-950 underline font-bold cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  {/* 2. Amount Confirmation if confidence is low */}
                  {confidence.amount < 0.85 && !confirmedFields.amount && (
                    <div className="p-3 rounded-xl bg-orange-50/95 border border-orange-200 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                        <span className="text-orange-950 font-medium">
                          Por favor confirmá o ajustá el importe de <strong>${editMonto.toLocaleString('es-AR')}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setConfidence(prev => ({ ...prev, amount: 1.0 }));
                          setConfirmedFields(prev => ({ ...prev, amount: true }));
                          onShowToast('Importe confirmado', 'success');
                        }}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                      >
                        ✓ Confirmar
                      </button>
                    </div>
                  )}

                  {/* 3. AI Confidence Metrics Breakdown */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-white/90 border border-purple-200/80 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Confianza de interpretación:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        confidence.amount >= 0.9 || confirmedFields.amount
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Monto: {confirmedFields.amount ? '100% ✓' : `${Math.round(confidence.amount * 100)}%`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        confidence.category >= 0.9 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Rubro: {Math.round(confidence.category * 100)}%
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        confirmedFields.paymentMethod || confidence.paymentMethod >= 0.85 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Pago: {confirmedFields.paymentMethod ? '100% ✓' : `${Math.round(confidence.paymentMethod * 100)}%`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                        confidence.installments >= 0.9 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Cuotas: {Math.round(confidence.installments * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form depending on Operation */}
              {editTipoOperacion === 'meta' ? (
                /* Meta / Fondo Destination Form */
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <Target className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Aporte directo a Meta de Ahorro</p>
                      <p className="text-[11px] text-amber-800">
                        Se sumará a la meta elegida y se registrará en los movimientos para cuadrar tu balance.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Monto Aporte */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Monto del Aporte
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-base font-extrabold text-slate-400">$</span>
                        <input
                          type="number"
                          value={editMonto || ''}
                          onChange={(e) => setEditMonto(parseFloat(e.target.value) || 0)}
                          className="w-full text-base sm:text-lg font-black text-slate-900 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Meta Selector */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Meta de Ahorro Destino
                      </label>
                      {goals.length > 0 ? (
                        <select
                          value={selectedGoalId}
                          onChange={(e) => setSelectedGoalId(e.target.value)}
                          className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                        >
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.emoji || '🎯'} {g.nombre} (Meta: ${g.montoObjetivo.toLocaleString('es-AR')})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-rose-600 font-bold">No hay metas creadas todavía</p>
                      )}
                    </div>
                  </div>

                  {/* Concept / Note */}
                  <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Detalle o Nota
                    </label>
                    <input
                      type="text"
                      value={editConcepto}
                      onChange={(e) => setEditConcepto(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-900 focus:outline-none"
                      placeholder="Ej: Aporte extra mensual"
                    />
                  </div>

                  {/* Save Meta Button */}
                  <button
                    type="button"
                    onClick={handleSaveExpense}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-600 text-white font-extrabold text-sm shadow-md shadow-orange-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Target className="w-4 h-4" />
                    <span>Confirmar Aporte (${editMonto.toLocaleString('es-AR')})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : editTipoOperacion === 'ingreso' ? (
                /* Ingreso Form */
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Registro de Ingreso de Dinero</p>
                      <p className="text-[11px] text-emerald-800">
                        Sumará saldo positivo a tus ingresos del mes.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Monto */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Monto Ingreso
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-base font-extrabold text-emerald-600">$</span>
                        <input
                          type="number"
                          value={editMonto || ''}
                          onChange={(e) => setEditMonto(parseFloat(e.target.value) || 0)}
                          className="w-full text-base sm:text-lg font-black text-slate-900 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Concepto */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Concepto / Origen
                      </label>
                      <input
                        type="text"
                        value={editConcepto}
                        onChange={(e) => setEditConcepto(e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 focus:outline-none"
                        placeholder="Ej: Sueldo, Cobro honorarios"
                      />
                    </div>

                    {/* Subcategoría de Ingreso */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Tipo de Ingreso
                      </label>
                      <select
                        value={editSubcategoria || 'Sueldo'}
                        onChange={(e) => setEditSubcategoria(e.target.value)}
                        className="w-full text-xs font-bold text-emerald-800 bg-transparent focus:outline-none"
                      >
                        <option value="Sueldo">Sueldo / Salario</option>
                        <option value="Honorarios">Honorarios Profesionales</option>
                        <option value="Ventas">Ventas / Negocio</option>
                        <option value="Rendimientos">Rendimientos / Intereses</option>
                        <option value="Regalo">Regalo / Extra</option>
                        <option value="Otro">Otro Ingreso</option>
                      </select>
                    </div>

                    {/* Método de Cobro */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Medio de Cobro
                      </label>
                      <select
                        value={editMetodoPago}
                        onChange={(e) => setEditMetodoPago(e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                      >
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Mercado Pago">Mercado Pago</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Débito">Débito</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Income Button */}
                  <button
                    type="button"
                    onClick={handleSaveExpense}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Registrar Ingreso (${editMonto.toLocaleString('es-AR')})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Gasto Form */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Monto */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Monto Total
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-base font-extrabold text-slate-400">$</span>
                        <input
                          type="number"
                          value={editMonto || ''}
                          onChange={(e) => {
                            setEditMonto(parseFloat(e.target.value) || 0);
                            setConfirmedFields(prev => ({ ...prev, amount: true }));
                            setConfidence(prev => ({ ...prev, amount: 1.0 }));
                          }}
                          className="w-full text-base sm:text-lg font-black text-slate-900 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Comercio / Concepto */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Comercio / Concepto
                      </label>
                      <input
                        type="text"
                        value={editConcepto}
                        onChange={(e) => setEditConcepto(e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 focus:outline-none"
                        placeholder="Ej: Coto, YPF, Farmacia"
                      />
                    </div>

                    {/* Categoría Asignada */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Categoría
                      </label>
                      <select
                        value={editCategoria}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setEditCategoria(newCat);
                          setEditSubcategoria(categoryMap[newCat]?.[0] || 'General');
                          setConfirmedFields(prev => ({ ...prev, category: true }));
                          setConfidence(prev => ({ ...prev, category: 1.0 }));
                        }}
                        className="w-full text-xs font-bold text-purple-900 bg-transparent focus:outline-none"
                      >
                        {Object.keys(categoryMap).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategoría */}
                    <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Subcategoría
                      </label>
                      <select
                        value={editSubcategoria}
                        onChange={(e) => setEditSubcategoria(e.target.value)}
                        className="w-full text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
                      >
                        {(categoryMap[editCategoria] || []).map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tipo de Gasto & Método de Pago */}
                  <div className="p-2.5 rounded-xl bg-white border border-purple-200/80 shadow-2xs space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-bold text-slate-700">Tipo:</span>
                        <button
                          type="button"
                          onClick={() => setEditTipoGasto('individual')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            editTipoGasto === 'individual'
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Individual
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTipoGasto('pareja')}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            editTipoGasto === 'pareja'
                              ? 'bg-[#F95420] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Pareja (50/50)
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Método:</span>
                        <select
                          value={editMetodoPago}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditMetodoPago(val);
                            setConfirmedFields(prev => ({ ...prev, paymentMethod: true }));
                            setConfidence(prev => ({ ...prev, paymentMethod: 1.0 }));
                          }}
                          className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                        >
                          <option value="Débito">Débito</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Mercado Pago">Mercado Pago</option>
                        </select>
                      </div>
                    </div>

                    {/* SELECTOR DE TARJETA DE CRÉDITO CUANDO ES CRÉDITO */}
                    {editMetodoPago === 'Crédito' && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-purple-900 uppercase tracking-wide flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-purple-600" />
                            ¿Qué tarjeta de crédito usaste?
                          </label>
                          <span className="text-[10px] text-slate-500 font-medium">Elegí o escribí</span>
                        </div>

                        {/* Quick Card Chips */}
                        <div className="flex flex-wrap gap-1">
                          {COMMON_CREDIT_CARDS.map(card => (
                            <button
                              key={card}
                              type="button"
                              onClick={() => setEditTarjetaNombre(card)}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                editTarjetaNombre.toLowerCase() === card.toLowerCase()
                                  ? 'bg-purple-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {card}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={editTarjetaNombre}
                          onChange={(e) => setEditTarjetaNombre(e.target.value)}
                          placeholder="O ingresá otra tarjeta (Ej: Amex, Patagonia)"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Save Expense Button */}
                  <button
                    type="button"
                    onClick={handleSaveExpense}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Registrar Gasto (${editMonto.toLocaleString('es-AR')})
                      {editMetodoPago === 'Crédito' && editTarjetaNombre ? ` • ${editTarjetaNombre}` : ''}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Quick Clickable Examples if nothing recorded yet */
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Ejemplos rápidos para probar
                </span>
                <span className="text-[10px] text-purple-600 font-bold">Tocá uno para probar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectExample('Gasté 50000 en farmacia con la Visa')}
                  className="p-2.5 rounded-xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">💳</span>
                    <div>
                      <div className="text-xs font-bold text-purple-950 group-hover:text-purple-700">
                        "Gasté 50000 en farmacia con la Visa"
                      </div>
                      <div className="text-[10px] text-purple-700">
                        → Salud / Farmacia • Tarjeta Visa ($50.000)
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Agregué 50000 al fondo para Mendoza')}
                  className="p-2.5 rounded-xl border border-orange-200/80 bg-orange-50/50 hover:bg-orange-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <div>
                      <div className="text-xs font-bold text-orange-950 group-hover:text-orange-700">
                        "Agregué 50000 al fondo para Mendoza"
                      </div>
                      <div className="text-[10px] text-orange-700">
                        → Aporte a Meta de Ahorro ($50.000)
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Gasté 11000 en verdulería')}
                  className="p-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🥬</span>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-700">
                        "Gasté 11000 en verdulería"
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        → Monto exacto $11.000
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Cobré 150000 de sueldo')}
                  className="p-2.5 rounded-xl border border-blue-200/80 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">💵</span>
                    <div>
                      <div className="text-xs font-bold text-blue-950 group-hover:text-blue-700">
                        "Cobré 150000 de sueldo"
                      </div>
                      <div className="text-[10px] text-blue-700">
                        → Ingresos / Sueldo ($150.000)
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectExample('Pedí pizza y empanadas 18000 en Pedidos Ya')}
                  className="p-2.5 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-100/70 text-left transition-colors cursor-pointer group sm:col-span-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍕</span>
                    <div>
                      <div className="text-xs font-bold text-rose-950 group-hover:text-rose-700">
                        "Pedí pizza y empanadas 18000 en Pedidos Ya"
                      </div>
                      <div className="text-[10px] text-rose-700">
                        → Alimentación / Delivery (PedidosYa / Rappi) • $18.000
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Option: Upload audio note from WhatsApp or files */}
          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
            >
              <FileAudio className="w-4 h-4 text-purple-600" />
              <span>Subir nota de audio o archivo de WhatsApp (.mp3, .ogg, .m4a)</span>
            </button>
          </div>

        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 shrink-0">
          Dictá libremente tus compras diarias y GastoAR las sumará al balance del mes de inmediato.
        </div>

      </div>

      {/* Learned Preferences Modal */}
      <LearnedPreferencesModal
        isOpen={showLearnedPreferences}
        onClose={() => setShowLearnedPreferences(false)}
        categoryMap={categoryMap}
        onShowToast={onShowToast}
      />
    </div>
  );
};
