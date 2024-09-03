import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../utility/PaymentVoucher.css';

const SingleCashPayment = ({ onClose, onSave }) => {
    const [voucherNumber, setVoucherNumber] = useState('AUTO');
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [taxable, setTaxable] = useState(false);
    const [discount, setDiscount] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [payer, setPayer] = useState('Salalah');
    const [payee, setPayee] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [narration, setNarration] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async () => {
        if (!fromAccount || !toAccount || !amount) {
            setErrorMessage('Please fill in all required fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'paymentVouchers'), {
                voucherNumber,
                fromAccount,
                toAccount,
                amount,
                taxable,
                discount,
                transactionDate,
                payer,
                payee,
                referenceNumber,
                description,
                narration,
                createdAt: new Date(),
            });
            alert('Payment Voucher saved successfully!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving payment voucher:', error);
            alert('Failed to save payment voucher');
        }
    };

    return (
        <div className="payment-voucher-modal">
            <div className="payment-voucher-content">
                <h2>New Cash Payment</h2>
                <button className="close-button" onClick={onClose}>X</button>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <div className="form-group">
                    <label>Voucher Number</label>
                    <input type="text" value={voucherNumber} readOnly />
                </div>
                <div className="form-group">
                    <label>From Account</label>
                    <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Bank">Bank</option>
                        <option value="Cash">Cash</option>
                        {/* Add more options as necessary */}
                    </select>
                </div>
                <div className="form-group">
                    <label>To Account</label>
                    <select value={toAccount} onChange={(e) => setToAccount(e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                        <option value="Expenses">Expenses</option>
                        {/* Add more options as necessary */}
                    </select>
                </div>
                <div className="form-group">
                    <label>Amount</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <label>
                        <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} /> Taxable
                    </label>
                </div>
                <div className="form-group">
                    <label>Discount</label>
                    <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                    <label>Actual Amount: {amount - discount}</label>
                </div>
                <div className="form-group">
                    <label>Transaction Date</label>
                    <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Payer</label>
                    <input type="text" value={payer} readOnly />
                </div>
                <div className="form-group">
                    <label>Payee</label>
                    <input type="text" value={payee} onChange={(e) => setPayee(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Reference Number</label>
                    <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Narration</label>
                    <textarea value={narration} onChange={(e) => setNarration(e.target.value)} />
                </div>
                <div className="payment-voucher-actions">
                    <button onClick={handleSubmit}>Save</button>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default SingleCashPayment;
