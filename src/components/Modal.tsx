import { ReactNode, useEffect } from 'react';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

export default function Modal({ title, open, onClose, children, actions }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>{title}</h3>
          <button aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="modalBody">{children}</div>
        {actions && <div className="modalActions">{actions}</div>}
      </div>
    </div>
  );
}
