import type { ModalState } from '../types';

interface ModalDialogProps {
  modal: ModalState;
  modalValue: string;
  onSubmitModal: () => void;
  onCloseModal: () => void;
  onModalValueChange: (value: string) => void;
}

export function ModalDialog({
  modal,
  modalValue,
  onSubmitModal,
  onCloseModal,
  onModalValueChange,
}: ModalDialogProps) {
  if (!modal) {
    return null;
  }

  return (
    <div className="overlay" onMouseDown={() => onCloseModal()}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>{modal.title}</h2>
        {modal.type === 'delete' || modal.type === 'switch-workspace' ? (
          <p>Esta acao e sensivel. Confirme para continuar.</p>
        ) : (
          <input
            autoFocus
            value={modalValue}
            onChange={(event) => onModalValueChange(event.target.value)}
            placeholder={modal.type === 'move' ? 'Pasta de destino' : 'Nome'}
          />
        )}
        <div className="modal-actions">
          <button className="text-button" onClick={() => onCloseModal()} type="button">
            Cancelar
          </button>
          <button
            className={modal.type === 'delete' || modal.type === 'switch-workspace' ? 'primary-button danger' : 'primary-button'}
            onClick={() => onSubmitModal()}
            type="button"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
