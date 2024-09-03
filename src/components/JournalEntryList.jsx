import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import JournalEntry from './JournalEntry';

const JournalEntryList = () => {
    const [journalEntries, setJournalEntries] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchJournalEntries = async () => {
            const querySnapshot = await getDocs(collection(db, 'journalEntries'));
            const entries = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setJournalEntries(entries);
        };

        fetchJournalEntries();
    }, [showModal]); // Re-fetch journal entries when the modal is closed

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSave = () => {
        setShowModal(false);
    };

    return (
        <div className="journal-entry-list">
            <h2>Journal Entry List</h2>
            <button onClick={handleOpenModal}>New Journal Entry</button>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Date</th>
                        <th>Total Debit</th>
                        <th>Total Credit</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {journalEntries.map(entry => (
                        <tr key={entry.id}>
                            <td>{entry.code}</td>
                            <td>{entry.date}</td>
                            <td>{entry.totalDebit}</td>
                            <td>{entry.totalCredit}</td>
                            <td>{entry.description}</td>
                            <td>
                                <button>View</button>
                                <button>Update</button>
                                <button>Print</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {showModal && <JournalEntry onClose={handleCloseModal} onSave={handleSave} />}
        </div>
    );
};

export default JournalEntryList;
