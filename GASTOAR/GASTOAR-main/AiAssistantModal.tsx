import React from 'react';
import { VoiceExpenseModal } from './VoiceExpenseModal';
import { Budgets, CategoryMap, CoupleProfile, Transaction } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Partial<Transaction>) => void;
  categoryMap: CategoryMap;
  profile: CoupleProfile;
  transactions: Transaction[];
  budgets: Budgets;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * Registro de Gasto por Voz con Inteligencia Artificial.
 * Reemplaza la funcionalidad anterior de cámara, texto libre y asesor por el dictado y análisis inteligente de audios.
 */
export const AiAssistantModal: React.FC<AiAssistantModalProps> = (props) => {
  return <VoiceExpenseModal {...props} />;
};
