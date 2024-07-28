// src/components/ProductModal.js
import React from 'react';

function ProductModal({ children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}>X</button>
        {children}
      </div>
    </div>
  );
}

export default ProductModal;
