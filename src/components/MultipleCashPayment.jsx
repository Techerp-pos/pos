import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../utility/PaymentVoucher.css';

const MultipleCashPayment = ({ onClose, onSave }) => {
    const [entries, setEntries] = useState([{ toAccount: '', amount: '', taxable: false }]);
    const [voucherNumber, setVoucherNumber] = useState('AUTO');
    const [fromAccount, setFromAccount] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [payer, setPayer] = useState('Salalah');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleAddRow = () => {
        setEntries([...entries, { toAccount: '', amount: '', taxable: false }]);
    };

    const handleRemoveRow = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
    };

    const handleChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleSubmit = async () => {
        if (!fromAccount || !transactionDate || entries.some(entry => !entry.toAccount || !entry.amount)) {
            setErrorMessage('Please fill in all required fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'paymentVouchers'), {
                voucherNumber,
                fromAccount,
                entries,
                transactionDate,
                payer,
                referenceNumber,
                description,
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
                    <label>Transaction Date</label>
                    <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Payer</label>
                    <input type="text" value={payer} readOnly />
                </div>
                <div className="form-group">
                    <label>Reference Number</label>
                    <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <table className="payment-entries-table">
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>To Account</th>
                            <th>Amount</th>
                            <th>Taxable</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <select value={entry.toAccount} onChange={(e) => handleChange(index, 'toAccount', e.target.value)}>
                                        <option value="">Select...</option>
                                        <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                                        <option value="Expenses">Expenses</option>
                                        {/* Add more options as necessary */}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleChange(index, 'amount', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={entry.taxable}
                                        onChange={(e) => handleChange(index, 'taxable', e.target.checked)}
                                    />
                                </td>
                                <td>
                                    <button onClick={() => handleRemoveRow(index)}>Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="payment-voucher-footer">
                    <button onClick={handleAddRow}>Add Row</button>
                </div>
                <div className="payment-voucher-actions">
                    <button onClick={handleSubmit}>Save</button>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default MultipleCashPayment;
