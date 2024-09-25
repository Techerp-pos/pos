import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
    TextField,
    Checkbox,
    FormControlLabel,
    Button,
    Grid,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Box,
} from '@mui/material';

const AddEditCustomer = ({ customer, onSave, onClose }) => {
    const { currentUser } = useAuth();
    const [customerData, setCustomerData] = useState({
        id: '',
        name: '',
        address: '',
        mobile: '',
        email: '',
        trn: '',
        micr: '',
        pricingLevel: '',
        group: 'DEFAULT',
        creditAmountLimit: 0,
        creditDayLimit: 0,
        openingAmount: 0,
        openingNature: '',
        taxRegistered: false,
        arCustomer: false,
        shopCode: currentUser.shopCode, // Automatically set the shopCode from currentUser
        addedBy: currentUser.uid,
        ...customer
    });

    useEffect(() => {
        if (!customer?.id) {
            generateCustomerId(); // Generate ID only when adding a new customer
        }
    }, [customer]);

    const generateCustomerId = async () => {
        try {
            const customersRef = collection(db, 'customers');
            const q = query(customersRef, orderBy('id', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.size > 0) {
                const latestCustomer = querySnapshot.docs[0].data();
                const newId = (parseInt(latestCustomer.id, 10) + 1).toString().padStart(4, '0');
                setCustomerData(prevState => ({ ...prevState, id: newId, micr: newId }));
            } else {
                setCustomerData(prevState => ({ ...prevState, id: '0001', micr: '0001' }));
            }
        } catch (error) {
            console.error("Error generating customer ID: ", error);
            alert("Failed to generate customer ID");
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCustomerData({
            ...customerData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (customer?.id) {
                await updateDoc(doc(db, 'customers', customer.id), customerData);
            } else {
                await addDoc(collection(db, 'customers'), customerData);
            }
            onSave();
        } catch (error) {
            console.error("Error saving customer: ", error);
            alert("Failed to save customer");
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Id"
                        name="id"
                        value={customerData.id}
                        onChange={handleChange}
                        InputProps={{ readOnly: true }}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Micr"
                        name="micr"
                        value={customerData.micr}
                        onChange={handleChange}
                        InputProps={{ readOnly: true }}
                        disabled
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={customerData.name}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Mobile"
                        name="mobile"
                        value={customerData.mobile}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={customerData.address}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={customerData.email}
                        onChange={handleChange}
                        type="email"
                    />
                </Grid>
                <Grid item xs={6}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="taxRegistered"
                                checked={customerData.taxRegistered}
                                onChange={handleChange}
                            />
                        }
                        label="Tax Registered"
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="TRN"
                        name="trn"
                        value={customerData.trn}
                        onChange={handleChange}
                        disabled={!customerData.taxRegistered}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Pricing Level"
                        name="pricingLevel"
                        value={customerData.pricingLevel}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel>Group</InputLabel>
                        <Select
                            name="group"
                            value={customerData.group}
                            onChange={handleChange}
                            label="Group"
                        >
                            <MenuItem value="DEFAULT">Default</MenuItem>
                            {/* <MenuItem value="VIP">VIP</MenuItem> */}
                            {/* Add more groups as needed */}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="arCustomer"
                                checked={customerData.arCustomer}
                                onChange={handleChange}
                            />
                        }
                        label="A/R Customer"
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Credit Amount Limit"
                        name="creditAmountLimit"
                        type="number"
                        value={customerData.creditAmountLimit}
                        onChange={handleChange}
                        disabled={!customerData.arCustomer}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Credit Day Limit"
                        name="creditDayLimit"
                        type="number"
                        value={customerData.creditDayLimit}
                        onChange={handleChange}
                        disabled={!customerData.arCustomer}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Opening Amount"
                        name="openingAmount"
                        type="number"
                        value={customerData.openingAmount}
                        onChange={handleChange}
                        disabled={!customerData.arCustomer}
                    />
                </Grid>
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel>Opening Nature</InputLabel>
                        <Select
                            name="openingNature"
                            value={customerData.openingNature}
                            onChange={handleChange}
                            label="Opening Nature"
                            disabled={!customerData.arCustomer}
                        >
                            <MenuItem value="" disabled>Select...</MenuItem>
                            <MenuItem value="CREDIT">Credit</MenuItem>
                            <MenuItem value="DEBIT">Debit</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Box mt={3} display="flex" justifyContent="space-between" gap="10px">
                <Button variant="contained" color="primary" type="submit">
                    Save Customer
                </Button>
                <Button variant="outlined" onClick={onClose}>
                    Cancel
                </Button>
            </Box>
        </Box>
    );
};

export default AddEditCustomer;
