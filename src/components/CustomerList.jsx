import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AddEditCustomer from './AddEditCustomer';
import CategoryModal from './CategoryModal';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    Box,
    styled,
} from '@mui/material';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding (theme.spacing(1) is 8px, so 0.625 * 8px = 5px)
}));

const CustomerList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            let customerQuery;
            if (isSuperAdmin) {
                customerQuery = collection(db, 'customers');
            } else {
                customerQuery = query(collection(db, 'customers'), where('shopCode', '==', currentUser.shopCode));
            }
            const customerSnapshot = await getDocs(customerQuery);
            setCustomers(customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchCustomers();
    }, [currentUser, isSuperAdmin]);

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = () => {
        setIsModalOpen(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Customer List</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
                >
                    Add Customer
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <CustomTableCell>Id</CustomTableCell>
                            <CustomTableCell>Name</CustomTableCell>
                            <CustomTableCell>Micr</CustomTableCell>
                            <CustomTableCell>Phone</CustomTableCell>
                            <CustomTableCell>Actions</CustomTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.map(customer => (
                            <TableRow key={customer.id}>
                                <CustomTableCell>{customer.id}</CustomTableCell>
                                <CustomTableCell>{customer.name}</CustomTableCell>
                                <CustomTableCell>{customer.micr}</CustomTableCell>
                                <CustomTableCell>{customer.phone}</CustomTableCell>
                                <CustomTableCell>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleEditCustomer(customer)}
                                    >
                                        Edit
                                    </Button>
                                </CustomTableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {isModalOpen && (
                <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddEditCustomer customer={selectedCustomer} onSave={handleSaveCustomer} onClose={() => setIsModalOpen(false)} />
                </CategoryModal>
            )}
        </Box>
    );
};

export default CustomerList;
