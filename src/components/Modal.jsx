const Modal = ({ open, onClose, children, className = '' }) => {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`modal-content ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="modal-scroll-area">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
