import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
    TextField, // Import TextField for search input
    styled,
} from '@mui/material';
import { Edit } from '@mui/icons-material';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding (theme.spacing(1) is 8px, so 0.625 * 8px = 5px)
}));

const CustomerList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]); // State for filtered customers
    const [searchTerm, setSearchTerm] = useState(''); // State for search term
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        let customerQuery;
        if (isSuperAdmin) {
            customerQuery = collection(db, 'customers');
        } else {
            customerQuery = query(collection(db, 'customers'), where('shopCode', '==', currentUser.shopCode));
        }

        const unsubscribe = onSnapshot(customerQuery, (snapshot) => {
            const customerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(customerList);
            setFilteredCustomers(customerList); // Initialize filtered customers
        });

        return () => unsubscribe(); // Clean up the subscription on component unmount
    }, [currentUser, isSuperAdmin]);

    // Handle search input changes
    const handleSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchTerm(value);

        // Filter customers based on the search term (match name, micr, or mobile)
        const filtered = customers.filter((customer) =>
            customer.name.toLowerCase().includes(value) ||
            customer.micr.toLowerCase().includes(value) ||
            customer.mobile.toLowerCase().includes(value)
        );
        setFilteredCustomers(filtered);
    };

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = () => {
        setIsModalOpen(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap= " 30px">
                {/* <Typography variant="h4">Customer List</Typography> */}
                {/* Search Input */}
                <TextField
                    label="Search Customers"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={searchTerm}
                    onChange={handleSearch} // Handle search input change
                    placeholder="Search by name, MICR, or phone"
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
                >
                    +
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
                        {filteredCustomers.map((customer, index) => (
                            <TableRow key={customer.id}
                            hover
                            sx={{
                                backgroundColor : index % 2 === 1 ? '#f7f7f7' : 'inherit'
                            }}
                            >
                                <CustomTableCell>{customer.id}</CustomTableCell>
                                <CustomTableCell>{customer.name}</CustomTableCell>
                                <CustomTableCell>{customer.micr}</CustomTableCell>
                                <CustomTableCell>{customer.mobile}</CustomTableCell>
                                <CustomTableCell>
                                    <Button
                                        color="primary"
                                        onClick={() => handleEditCustomer(customer)}
                                    >
                                        <Edit />
                                    </Button>
                                </CustomTableCell>
                            </TableRow>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <CustomTableCell colSpan={5} align="center">
                                    No customers found.
                                </CustomTableCell>
                            </TableRow>
                        )}
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
