import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AddEditVendor from './AddEditVendor';
import CategoryModal from './CategoryModal';
import {
    Box,
    Button,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    IconButton,
    TextField, // Import TextField for search input
    styled,
} from '@mui/material';
import { Edit } from '@mui/icons-material';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding (theme.spacing(1) is 8px, so 0.625 * 8px = 5px)
}));

const VendorList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]); // State for filtered vendors
    const [searchTerm, setSearchTerm] = useState(''); // State for search term
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    useEffect(() => {
        const fetchVendors = async () => {
            let vendorQuery;
            if (isSuperAdmin) {
                vendorQuery = collection(db, 'vendors');
            } else {
                vendorQuery = query(collection(db, 'vendors'), where('shopCode', '==', currentUser.shopCode));
            }
            const vendorSnapshot = await getDocs(vendorQuery);
            const vendorsList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort vendors by vendor name (ascending order)
            vendorsList.sort((a, b) => a.name.localeCompare(b.name));

            setVendors(vendorsList);
            setFilteredVendors(vendorsList); // Initialize filtered vendors
        };

        fetchVendors();
    }, [currentUser, isSuperAdmin]);

    // Handle search input changes
    const handleSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchTerm(value);

        // Filter vendors based on the search term (by name, contact, or address)
        const filtered = vendors.filter((vendor) =>
            vendor.name.toLowerCase().includes(value) ||
            vendor.contact.toLowerCase().includes(value) ||
            vendor.address.toLowerCase().includes(value)
        );
        setFilteredVendors(filtered);
    };

    const handleEditVendor = (vendor) => {
        setSelectedVendor(vendor);
        setIsModalOpen(true);
    };

    const handleSaveVendor = () => {
        setIsModalOpen(false); // Close modal after saving
        fetchVendors(); // Re-fetch vendors to update the list
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Typography variant="h6" component="h4">
                    Vendor List
                </Typography>
                <TextField
                    label="Search Vendors"
                    variant="outlined"
                    value={searchTerm}
                    onChange={handleSearch} // Handle search input change
                    placeholder="Search by name, contact, or address"
                    sx={{ mx: 2, flexGrow: 1 }} // Center the search bar and make it wider
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setSelectedVendor(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Vendor
                </Button>
            </Box>

            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <CustomTableCell>Vendor Code</CustomTableCell>
                            <CustomTableCell>Vendor Name</CustomTableCell>
                            <CustomTableCell>Contact</CustomTableCell>
                            <CustomTableCell>Address</CustomTableCell>
                            <CustomTableCell>Actions</CustomTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredVendors.map((vendor, index) => (
                            <TableRow key={vendor.id} hover
                            sx= {{
                                backgroundColor : index % 2 === 1 ? '#f7f7f7' : 'inherit' ,
                            }}
                            >
                                <CustomTableCell>{vendor.code}</CustomTableCell>
                                <CustomTableCell>{vendor.name}</CustomTableCell>
                                <CustomTableCell>{vendor.contact}</CustomTableCell>
                                <CustomTableCell>{vendor.address}</CustomTableCell>
                                <CustomTableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleEditVendor(vendor)}
                                    >
                                        <Edit />
                                    </IconButton>
                                </CustomTableCell>
                            </TableRow>
                        ))}
                        {filteredVendors.length === 0 && (
                            <TableRow>
                                <CustomTableCell colSpan={5} align="center">
                                    No vendors found.
                                </CustomTableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {isModalOpen && (
                <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddEditVendor vendor={selectedVendor} onSave={handleSaveVendor} onClose={() => setIsModalOpen(false)} />
                </CategoryModal>
            )}
        </Box>
    );
};

export default VendorList;
