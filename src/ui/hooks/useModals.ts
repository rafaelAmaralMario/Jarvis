import { useState } from 'react';
import type { ModalState } from '../../shared/types';

export function useModals() {
  const [modal, setModal] = useState<ModalState>(null);
  const [modalValue, setModalValue] = useState('');

  function openModal(nextModal: ModalState) {
    setModal(nextModal);
    if (nextModal?.type === 'rename') {
      setModalValue(nextModal.entry.name);
    } else {
      setModalValue('');
    }
  }

  function closeModal() {
    setModal(null);
  }

  return { modal, setModal, modalValue, setModalValue, openModal, closeModal };
}
