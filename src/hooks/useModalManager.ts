import { useState, useCallback } from 'react';

export type ModalType = 
  | 'profile'
  | 'editProfile'
  | 'vehicleManagement'
  | 'favorites'
  | 'privacySettings'
  | 'filter'
  | 'advancedFilter'
  | 'enhancedFilter'
  | 'routePlanning'
  | 'themeSettings'
  | 'reviews'
  | 'addVehicle';

interface ModalState {
  [key: string]: boolean;
}

export function useModalManager() {
  const [modals, setModals] = useState<ModalState>({});

  const openModal = useCallback((modalType: ModalType) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  }, []);

  const closeModal = useCallback((modalType: ModalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({});
  }, []);

  const isModalOpen = useCallback((modalType: ModalType) => {
    return Boolean(modals[modalType]);
  }, [modals]);

  const switchModal = useCallback((fromModal: ModalType, toModal: ModalType) => {
    setModals(prev => ({
      ...prev,
      [fromModal]: false,
      [toModal]: true,
    }));
  }, []);

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    switchModal,
  };
}
