import React from 'react';

function Modal({ children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}

export default Modal;
