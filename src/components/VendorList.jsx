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
    styled,
} from '@mui/material';
import { Edit } from '@mui/icons-material';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding (theme.spacing(1) is 8px, so 0.625 * 8px = 5px)
}));

const VendorList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [vendors, setVendors] = useState([]);
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
        };

        fetchVendors();
    }, [currentUser, isSuperAdmin]);

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
                        {vendors.map(vendor => (
                            <TableRow key={vendor.id} hover>
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
