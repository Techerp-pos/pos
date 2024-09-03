import React, { useState } from 'react';
import SingleCashPayment from './SingleCashPayment';
import MultipleCashPayment from './MultipleCashPayment';

const PaymentVoucher = () => {
    const [modalType, setModalType] = useState(null);

    const handleModalClose = () => {
        setModalType(null);
    };

    const handleSave = () => {
        // Handle saving logic, maybe refresh the list or show a success message
    };

    return (
        <div>
            <button onClick={() => setModalType('single')}>Single Payment Cash Transaction</button>
            <button onClick={() => setModalType('multiple')}>Multiple Payment Cash Transaction</button>

            {modalType === 'single' && (
                <SingleCashPayment onClose={handleModalClose} onSave={handleSave} />
            )}
            {modalType === 'multiple' && (
                <MultipleCashPayment onClose={handleModalClose} onSave={handleSave} />
            )}
        </div>
    );
};

export default PaymentVoucher;
