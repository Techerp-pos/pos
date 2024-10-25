import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, Checkbox } from '@mui/material';
import { Box, width } from '@mui/system';

const generateCode = () => {
    return 'JV-' + Math.floor(1000 + Math.random() * 9000);
};

const JournalEntry = ({ onClose, initialData }) => {
    const [entries, setEntries] = useState([{ ledger: '', narration: '', debit: '', credit: '', taxable: false }]);
    const [date, setDate] = useState(initialData?.date || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [code, setCode] = useState(initialData?.code || generateCode());
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        calculateTotals(entries);
    }, [entries]);

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
            onClose();
        } catch (error) {
            console.error('Error saving journal entry:', error);
            alert('Failed to save journal entry');
        }
    };

    return (
        <div>
            <h2 style={{
                marginBottom: '10px'
            }}>{initialData ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
            {errorMessage && <p>{errorMessage}</p>}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <Box mb={4} style={{width: '50%'}}>
                    <TextField label="Code" value={code} fullWidth readOnly />
                </Box>
                <Box mb={2}>
                    <TextField
                        label="Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
                <Box mb={2} style={{width: '30%'}}>
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                    />
                </Box>
            </div>

            <div style={{
                padding: '20px',
                boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px',
                borderRadius: '5px'
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>SN</TableCell>
                            <TableCell>Ledger</TableCell>
                            <TableCell>Narration</TableCell>
                            <TableCell>Debit</TableCell>
                            <TableCell>Credit</TableCell>
                            <TableCell>Taxable</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <TextField
                                        value={entry.ledger}
                                        onChange={(e) => handleChange(index, 'ledger', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        value={entry.narration}
                                        onChange={(e) => handleChange(index, 'narration', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        value={entry.debit}
                                        onChange={(e) => handleChange(index, 'debit', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        value={entry.credit}
                                        onChange={(e) => handleChange(index, 'credit', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Checkbox
                                        checked={entry.taxable}
                                        onChange={(e) => handleChange(index, 'taxable', e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button onClick={() => handleRemoveRow(index)}>Remove</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>


            <Button onClick={handleAddRow}>Add Row</Button>
            <Box mt={2}>
                <p>Total Debit: {totalDebit}</p>
                <p>Total Credit: {totalCredit}</p>
            </Box>
            <Box mt={2}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Save
                    </Button>
                    <Button variant="outlined" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Box>
        </div>
    );
};

export default JournalEntry;
