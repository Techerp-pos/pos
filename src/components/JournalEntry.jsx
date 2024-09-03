import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../utility/JournalEntry.css'; // Make sure to add appropriate styling

const JournalEntry = ({ onClose, onSave }) => {
    const [entries, setEntries] = useState([{ ledger: '', narration: '', debit: '', credit: '', taxable: false }]);
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [code, setCode] = useState('AUTO');
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const handleAddRow = () => {
        setEntries([...entries, { ledger: '', narration: '', debit: '', credit: '', taxable: false }]);
    };

    const handleRemoveRow = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
        calculateTotals(newEntries);
    };

    const handleChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
        calculateTotals(newEntries);
    };

    const calculateTotals = (entries) => {
        const totalDebit = entries.reduce((sum, entry) => sum + parseFloat(entry.debit || 0), 0);
        const totalCredit = entries.reduce((sum, entry) => sum + parseFloat(entry.credit || 0), 0);
        setTotalDebit(totalDebit.toFixed(2));
        setTotalCredit(totalCredit.toFixed(2));
    };

    const handleSubmit = async () => {
        if (totalDebit !== totalCredit) {
            setErrorMessage('Total Debit and Credit must be equal.');
            return;
        }

        try {
            await addDoc(collection(db, 'journalEntries'), {
                code,
                date,
                description,
                entries,
                totalDebit,
                totalCredit,
                createdAt: new Date()
            });
            alert('Journal Entry saved successfully!');
            onSave();
            onClose(); // Close the modal after saving
        } catch (error) {
            console.error('Error saving journal entry:', error);
            alert('Failed to save journal entry');
        }
    };

    return (
        <div className="journal-entry-modal">
            <div className="journal-entry-content">
                <h2>New Journal Entry</h2>
                <button className="close-button" onClick={onClose}>X</button>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <div className="form-group">
                    <label>Code</label>
                    <input type="text" value={code} readOnly />
                </div>
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <table className="journal-entries-table">
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>Ledger</th>
                            <th>Narration</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Taxable</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <input
                                        type="text"
                                        value={entry.ledger}
                                        onChange={(e) => handleChange(index, 'ledger', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={entry.narration}
                                        onChange={(e) => handleChange(index, 'narration', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={entry.debit}
                                        onChange={(e) => handleChange(index, 'debit', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={entry.credit}
                                        onChange={(e) => handleChange(index, 'credit', e.target.value)}
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
                <div className="journal-entry-footer">
                    <button onClick={handleAddRow}>Add Row</button>
                    <div className="totals">
                        <p>Total Debit: {totalDebit}</p>
                        <p>Total Credit: {totalCredit}</p>
                    </div>
                </div>
                <div className="journal-entry-actions">
                    <button onClick={handleSubmit}>Save</button>
                    <button onClick={onClose}>Close</button> {/* Close button added here */}
                </div>
            </div>
        </div>
    );
};

export default JournalEntry;
