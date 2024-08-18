import React from 'react';
import '../utility/CategoryModal.css';

const CategoryModal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="category-modal-overlay">
            <div className="category-modal-content">
                <button className="close-btn" onClick={onClose}>X</button>
                {children}
            </div>
        </div>
    );
};

export default CategoryModal;
