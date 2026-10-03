// UserProfileModal.tsx
// Modal de Perfil de Usuario con la información de la solapa Mi Perfil
// Reemplaza la vista anterior por el diseño y contenido de ProfileScreen

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProfileScreen } from './mobileScreens/ProfileScreen';
import { CoupleProfile, UserAccount, UserSubscription } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount: UserAccount | null;
  profile: CoupleProfile;
  currentSubscription?: UserSubscription | null;
  activeSubscription?: UserSubscription | null;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onUpdateProfile?: (newProfile: Partial<CoupleProfile>) => void;
  onUpdateAccount?: (updated: Partial<UserAccount>) => void;
  onJoinAccount?: (code: string) => void;
  onApplyDiscountCode?: (code: string) => void;
  onLinkCoupleCode?: (code: string) => void;
  onOpenSubscriptionsTab?: () => void;
  onOpenCloudSync?: () => void;
  onLogout: () => void;
  onSelectPlanPayment?: (plan: any, cycle: any) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  profile,
  activeSubscription,
  currentSubscription,
  onUpdateProfile,
  onOpenSubscriptionsTab,
  onOpenCloudSync,
  onLogout,
  onShowToast,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  const subscription = activeSubscription || currentSubscription;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Card with ProfileScreen info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 z-10 my-auto max-h-[92vh] flex flex-col"
        >
          <ProfileScreen
            onBack={onClose}
            onClose={onClose}
            userAccount={userAccount}
            profile={profile}
            subscription={subscription}
            onUpdateProfile={onUpdateProfile}
            onNavigateToTab={(tab) => {
              onClose();
              if (onNavigateToTab) {
                onNavigateToTab(tab);
              } else if (onOpenSubscriptionsTab && tab === 'subscriptions') {
                onOpenSubscriptionsTab();
              }
            }}
            onOpenCloudSync={() => {
              onClose();
              if (onOpenCloudSync) onOpenCloudSync();
            }}
            onLogout={() => {
              onClose();
              onLogout();
            }}
            onShowToast={onShowToast}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
