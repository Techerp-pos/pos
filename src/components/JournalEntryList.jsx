import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Modal, Paper } from '@mui/material';
import JournalEntry from './JournalEntry';
import { Box, margin } from '@mui/system';

const JournalEntryList = () => {
    const [journalEntries, setJournalEntries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

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

    const handleOpenModal = (entry) => {
        setSelectedEntry(entry);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <div>
            <h2>Journal Entry List</h2>
            <Button variant="contained" color="primary" onClick={() => handleOpenModal(null)} style={{
                margin: '10px'
            }}>
                New Journal Entry
            </Button>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Total Debit</TableCell>
                        <TableCell>Total Credit</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {journalEntries.map(entry => (
                        <TableRow key={entry.id}>
                            <TableCell>{entry.code}</TableCell>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>{entry.totalDebit}</TableCell>
                            <TableCell>{entry.totalCredit}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>
                                <Button onClick={() => handleOpenModal(entry)}>View</Button>
                                <Button>Update</Button>
                                <Button>Print</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Modal for viewing or adding new journal entry */}
            <Modal open={showModal} onClose={handleCloseModal}>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh" /* Centers the modal vertically and horizontally */
                >
                    <Paper style={{ padding: '20px', margin: '20px', width: '1200px' }}>
                        <JournalEntry
                            onClose={handleCloseModal}
                            initialData={selectedEntry}
                        />
                    </Paper>
                </Box>
            </Modal>
        </div>
    );
};

export default JournalEntryList;
