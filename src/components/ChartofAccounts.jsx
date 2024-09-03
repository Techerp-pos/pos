import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase'; // Import Firestore from your config file
import '../utility/ChartOfAccounts.css'; // Import your custom CSS file
import { collection, addDoc, getDocs } from 'firebase/firestore'; // Firestore imports

const ChartOfAccounts = () => {
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedLedgers, setExpandedLedgers] = useState({});
    const [expandedSubLedgers, setExpandedSubLedgers] = useState({});

    // Initialize formState
    const [formState, setFormState] = useState({
        showForm: false,
        type: '',
        ledgerId: '',
        subLedgerId: '',
        name: ''
    });

    useEffect(() => {
        const fetchLedgers = async () => {
            setLoading(true);
            try {
                const ledgerSnapshot = await getDocs(collection(db, 'chartOfAccounts'));
                const ledgersData = ledgerSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    subLedgers: null, // Lazy load sub-ledgers
                }));
                setLedgers(ledgersData);
            } catch (error) {
                console.error('Error fetching ledgers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLedgers();
    }, []);

    const loadSubLedgers = async (ledgerId) => {
        const ledgerIndex = ledgers.findIndex(ledger => ledger.id === ledgerId);
        if (ledgers[ledgerIndex].subLedgers === null) { // Load only if not already loaded
            setLoading(true);
            try {
                const subLedgerSnapshot = await getDocs(collection(db, 'chartOfAccounts', ledgerId, 'subLedgers'));
                const subLedgers = subLedgerSnapshot.docs.map(subDoc => ({
                    id: subDoc.id,
                    name: subDoc.data().name,
                    subSubLedgers: null, // Lazy load sub-sub-ledgers
                }));
                const updatedLedgers = [...ledgers];
                updatedLedgers[ledgerIndex].subLedgers = subLedgers;
                setLedgers(updatedLedgers);
            } catch (error) {
                console.error('Error loading sub-ledgers:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const loadSubSubLedgers = async (ledgerId, subLedgerId) => {
        const ledgerIndex = ledgers.findIndex(ledger => ledger.id === ledgerId);
        const subLedgerIndex = ledgers[ledgerIndex].subLedgers.findIndex(subLedger => subLedger.id === subLedgerId);
        if (ledgers[ledgerIndex].subLedgers[subLedgerIndex].subSubLedgers === null) {
            setLoading(true);
            try {
                const subSubLedgerSnapshot = await getDocs(collection(db, 'chartOfAccounts', ledgerId, 'subLedgers', subLedgerId, 'subSubLedgers'));
                const subSubLedgers = subSubLedgerSnapshot.docs.map(subSubDoc => ({
                    id: subSubDoc.id,
                    name: subSubDoc.data().name,
                }));
                const updatedLedgers = [...ledgers];
                updatedLedgers[ledgerIndex].subLedgers[subLedgerIndex].subSubLedgers = subSubLedgers;
                setLedgers(updatedLedgers);
            } catch (error) {
                console.error('Error loading sub-sub-ledgers:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleExpand = (ledgerId) => {
        setExpandedLedgers(prevState => ({
            ...prevState,
            [ledgerId]: !prevState[ledgerId]
        }));
        if (!expandedLedgers[ledgerId]) {
            loadSubLedgers(ledgerId);
        }
    };

    const toggleExpandSubLedger = (ledgerId, subLedgerId) => {
        const expandedKey = `${ledgerId}-${subLedgerId}`;
        setExpandedSubLedgers(prevState => ({
            ...prevState,
            [expandedKey]: !prevState[expandedKey]
        }));
        if (!expandedSubLedgers[expandedKey]) {
            loadSubSubLedgers(ledgerId, subLedgerId);
        }
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const { type, ledgerId, subLedgerId, name } = formState;
        try {
            setLoading(true);
            if (type === 'ledger') {
                const docRef = await addDoc(collection(db, 'chartOfAccounts'), { name });
                setLedgers([...ledgers, { id: docRef.id, name, subLedgers: null }]);
            } else if (type === 'subLedger') {
                await addDoc(collection(db, 'chartOfAccounts', ledgerId, 'subLedgers'), { name });
                await loadSubLedgers(ledgerId);
            } else if (type === 'subSubLedger') {
                await addDoc(collection(db, 'chartOfAccounts', ledgerId, 'subLedgers', subLedgerId, 'subSubLedgers'), { name });
                await loadSubSubLedgers(ledgerId, subLedgerId);
            }
            setFormState({ showForm: false, type: '', ledgerId: '', subLedgerId: '', name: '' });
        } catch (error) {
            console.error('Error adding ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const openForm = (type, ledgerId = '', subLedgerId = '') => {
        setFormState({ showForm: true, type, ledgerId, subLedgerId, name: '' });
    };

    const renderSubSubLedgers = (ledgerId, subLedger) => (
        expandedSubLedgers[`${ledgerId}-${subLedger.id}`] && subLedger.subSubLedgers && subLedger.subSubLedgers.map(subSubLedger => (
            <tr key={subSubLedger.id} className="sub-sub-ledger-row">
                <td className="sub-sub-ledger-name">{subSubLedger.name}</td>
                <td className="actions">
                    <button className="action-button">Edit</button>
                </td>
            </tr>
        ))
    );

    const renderSubLedgers = (ledger) => (
        expandedLedgers[ledger.id] && ledger.subLedgers && ledger.subLedgers.map(subLedger => (
            <React.Fragment key={subLedger.id}>
                <tr className="sub-ledger-row" onClick={() => toggleExpandSubLedger(ledger.id, subLedger.id)}>
                    <td className="sub-ledger-name">
                        {expandedSubLedgers[`${ledger.id}-${subLedger.id}`] ? '▼' : '►'} {subLedger.name}
                    </td>
                    <td className="actions">
                        <button className="action-button" onClick={() => openForm('subSubLedger', ledger.id, subLedger.id)}>Sub Ledger +</button>
                    </td>
                </tr>
                {renderSubSubLedgers(ledger.id, subLedger)}
            </React.Fragment>
        ))
    );

    const renderLedgers = () => (
        ledgers.map(ledger => (
            <React.Fragment key={ledger.id}>
                <tr className="ledger-row" onClick={() => toggleExpand(ledger.id)}>
                    <td className="ledger-name">
                        {expandedLedgers[ledger.id] ? '▼' : '►'} {ledger.name}
                    </td>
                    <td className="actions">
                        <button className="action-button" onClick={() => openForm('subLedger', ledger.id)}>Ledger +</button>
                    </td>
                </tr>
                {renderSubLedgers(ledger)}
            </React.Fragment>
        ))
    );

    return (
        <div className="chart-of-accounts-container">
            <h2>Chart Of Accounts</h2>
            <div className="actions-header">
                <button className="add-main-ledger-btn" onClick={() => openForm('ledger')}>Ledger +</button>
            </div>
            <table className="chart-of-accounts-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? <tr><td colSpan="2">Loading...</td></tr> : renderLedgers()}
                </tbody>
            </table>

            {formState.showForm && (
                <div className="ledger-form-container">
                    <form className="ledger-form" onSubmit={handleFormSubmit}>
                        <label>
                            {formState.type === 'ledger' ? 'Ledger Name:' : formState.type === 'subLedger' ? 'Sub-Ledger Name:' : 'Sub-Sub Ledger Name:'}
                            <input
                                type="text"
                                value={formState.name}
                                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                required
                            />
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="submit-btn">Add</button>
                            <button type="button" className="cancel-btn" onClick={() => setFormState({ showForm: false, type: '', ledgerId: '', subLedgerId: '', name: '' })}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccounts;
