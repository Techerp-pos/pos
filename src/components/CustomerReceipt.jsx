import React, { useState, useEffect } from 'react';
import { TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Modal, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import moment from 'moment';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, doc, writeBatch, setDoc, getDocs, where } from 'firebase/firestore';

function CustomerReceipt() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [totalToReceive, setTotalToReceive] = useState(0);
    const [paid, setPaid] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [transactionDate, setTransactionDate] = useState(moment());
    const [balance, setBalance] = useState(0);
    const [voucherNumber, setVoucherNumber] = useState('AUTO');
    const [account, setAccount] = useState('');
    const [cashPaid, setCashPaid] = useState(false);

    // Fetch all customer transactions
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'customerReceipts'), (snapshot) => {
            const transactionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(transactionList);
            setFilteredTransactions(transactionList);
        });

        return () => unsubscribe();
    }, []);

    // Fetch customers
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
            const customerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(customerList);
        });

        return () => unsubscribe();
    }, []);

    const handleSearch = (value) => {
        const lowercasedValue = value.toLowerCase();
        const filteredData = transactions.filter(transaction =>
            transaction.voucherNumber.toString().includes(lowercasedValue) ||
            transaction.customer.toLowerCase().includes(lowercasedValue)
        );
        setFilteredTransactions(filteredData);
    };

    const handleCustomerChange = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        setSelectedCustomer(customer);

        if (customer) {
            const ordersQuery = query(collection(db, 'orders'), where('customer', '==', customer.name));

            // Subscribe to real-time updates with onSnapshot
            const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
                const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const filteredOrders = orderList.filter(order => order.cashPaid !== true);
                setOrders(filteredOrders);
            });

            return () => unsubscribe();  // Unsubscribe when component unmounts
        }
    };

    const handleOrderSelection = (order, isSelected) => {
        let updatedSelectedOrders = [...selectedOrders];

        if (isSelected) {
            updatedSelectedOrders.push(order);
        } else {
            updatedSelectedOrders = updatedSelectedOrders.filter(o => o.id !== order.id);
        }

        setSelectedOrders(updatedSelectedOrders);
        recalculateFooterTotals(updatedSelectedOrders);
    };

    const recalculateFooterTotals = (ordersList) => {
        const totalToReceive = ordersList.reduce((sum, order) => sum + (parseFloat(order.total || 0)), 0);
        const totalPaid = ordersList.reduce((sum, order) => sum + (parseFloat(order.paid || 0)), 0);
        const totalBalance = totalToReceive - totalPaid - parseFloat(discount || 0);

        setTotalToReceive(totalToReceive);
        setPaid(totalPaid);
        setBalance(totalBalance);
    };

    const handleSaveReceipt = async () => {
        try {
            const voucherNumber = await generateNumericVoucherNumber();
            const newVoucherRef = doc(collection(db, 'customerReceipts'));

            const receiptData = {
                voucherNumber: voucherNumber || 1000,
                date: transactionDate.format('YYYY-MM-DD'),
                customer: selectedCustomer?.name || 'Unknown',
                totalAmount: parseFloat(totalToReceive) || 0,
                paymentType: account || 'cash',
                paidOrderDetails: selectedOrders.length > 0 ? selectedOrders.map(order => ({
                    orderId: order.id,
                    total: parseFloat(order.total) || 0,
                    paid: parseFloat(order.paid) || 0,
                    balance: parseFloat(order.total) - parseFloat(order.paid) // Storing balance for partial payments
                })) : [],
            };

            await setDoc(newVoucherRef, receiptData);

            const batch = writeBatch(db);
            selectedOrders.forEach(order => {
                const orderRef = doc(db, 'orders', order.id);
                const balance = (parseFloat(order.total) || 0) - (parseFloat(order.paid) || 0);
                batch.update(orderRef, {
                    CashReceipt: balance,
                    cashPaid: balance === 0 ? true : false, // Mark as fully paid if balance is 0
                    balance: balance // Update balance for future payments
                });
            });
            await batch.commit();

            closeModal();
        } catch (error) {
            console.error("Error saving receipt:", error);
        }
    };

    const generateNumericVoucherNumber = async () => {
        const latestVoucherSnapshot = await getDocs(collection(db, 'customerReceipts'));
        const voucherList = latestVoucherSnapshot.docs
            .map(doc => parseInt(doc.data().voucherNumber, 10))
            .filter(voucherNumber => !isNaN(voucherNumber));

        const maxVoucherNumber = voucherList.length > 0 ? Math.max(...voucherList) : 1000;
        return maxVoucherNumber + 1;
    };

    const openModal = (type) => {
        setAccount(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedCustomer(null);
        setTotalToReceive(0);
        setPaid(0);
        setSelectedOrders([]);
        setIsModalOpen(false);
    };

    // Function to handle printing the receipt as PDF
    const handlePrintReceipt = (transaction) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Customer Receipt', 20, 20);

        doc.setFontSize(12);
        doc.text(`Voucher Number: ${transaction.voucherNumber}`, 20, 30);
        doc.text(`Customer: ${transaction.customer}`, 20, 40);
        doc.text(`Date: ${transaction.date}`, 20, 50);
        doc.text(`Total Amount: ${transaction.totalAmount?.toFixed(3)} OMR`, 20, 60);
        doc.text(`Payment Type: ${transaction.paymentType}`, 20, 70);

        // Add table for paidOrderDetails if applicable
        if (transaction.paidOrderDetails && transaction.paidOrderDetails.length > 0) {
            const tableData = transaction.paidOrderDetails.map((order) => [
                order.orderId,
                order.total,
                order.paid,
                order.balance // Show balance in the printout
            ]);
            doc.autoTable({
                head: [['Order ID', 'Total', 'Paid', 'Balance']],
                body: tableData,
                startY: 80,
            });
        }

        // Save and open the PDF
        doc.save(`receipt_${transaction.voucherNumber}.pdf`);
    };

    const handlePaidChange = (value) => {
        const receivedAmount = parseFloat(value) || 0;
        const totalBalance = totalToReceive - receivedAmount - parseFloat(discount || 0);
        setPaid(receivedAmount);
        setBalance(totalBalance);
    };

    const handleDiscountChange = (value) => {
        const discountAmount = parseFloat(value) || 0;
        const totalBalance = totalToReceive - paid - discountAmount;
        setDiscount(discountAmount);
        setBalance(totalBalance);
    };

    return (
        <div style={{padding: '20px'}}>
            <Typography variant="h4" gutterBottom>Customer Transaction List</Typography>
            <Box display="flex" justifyContent="space-between" mb={3}>
                <TextField
                    label="Search Transactions"
                    variant="outlined"
                    onChange={(e) => handleSearch(e.target.value)}
                    fullWidth
                    style={{ marginRight: '20px' }}
                />
                <Box display="flex">
                    <Button variant="contained" color="primary" onClick={() => openModal('cash')} style={{ marginRight: '10px' }}>Cash</Button>
                    <Button variant="contained" color="secondary" onClick={() => openModal('bank')}>Bank</Button>
                </Box>
            </Box>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Voucher Number</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Discount</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell>{transaction.voucherNumber}</TableCell>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>{transaction.customer}</TableCell>
                            <TableCell>{transaction.totalAmount?.toFixed(3) || 0.000} OMR</TableCell>
                            <TableCell>{transaction.discount?.toFixed(3) || 0.000} OMR</TableCell>
                            <TableCell>{transaction.paid?.toFixed(3) || 0.000} OMR</TableCell>
                            <TableCell>{transaction.balance?.toFixed(3) || 0.000} OMR</TableCell>
                            <TableCell>
                                {/* Print Button */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handlePrintReceipt(transaction)}
                                >
                                    Print
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Modal open={isModalOpen} onClose={closeModal}>
                <Box sx={{ width: 900, padding: 3, backgroundColor: 'white', margin: '100px auto' }}>
                    <Typography variant="h6">Customer Cash Voucher</Typography>

                    <Box display="flex" gap={2} mt={2}>
                        <TextField label="Voucher Number" value={voucherNumber} disabled fullWidth />
                        <TextField
                            label="Date"
                            type="date"
                            value={transactionDate.format('YYYY-MM-DD')}
                            onChange={(e) => setTransactionDate(moment(e.target.value))}
                            fullWidth
                        />
                    </Box>

                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                        <InputLabel>Select Customer</InputLabel>
                        <Select value={selectedCustomer?.id || ''} onChange={(e) => handleCustomerChange(e.target.value)}>
                            {customers.map(customer => (
                                <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                        <InputLabel>Select Account</InputLabel>
                        <Select value={account || ''} onChange={(e) => setAccount(e.target.value)}>
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="bank">Bank</MenuItem>
                        </Select>
                    </FormControl>

                    <Table sx={{ marginTop: 3 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Select</TableCell>
                                <TableCell>Invoice Number</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Total</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedOrders.some(o => o.id === order.id)}
                                            onChange={(e) => handleOrderSelection(order, e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell>{order.orderNumber}</TableCell>
                                    <TableCell>{order.timestamp.toDate().toISOString().split('T')[0]}</TableCell>
                                    <TableCell>{order.paymentMethod}</TableCell>
                                    <TableCell>{order.total || 'Unable to Fetch'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Box display="flex" gap={2} mt={2}>
                        <TextField label="To Receive" value={totalToReceive.toFixed(3)} fullWidth readOnly />
                        <TextField
                            label="Discount"
                            value={discount}
                            onChange={(e) => handleDiscountChange(e.target.value)} // Add onChange handler
                            fullWidth
                        />
                        <TextField
                            label="Received"
                            value={paid}
                            onChange={(e) => handlePaidChange(e.target.value)} // Add onChange handler
                            fullWidth
                        />

                        <TextField label="Balance" value={balance.toFixed(3)} fullWidth readOnly />
                    </Box>

                    <Box display="flex" justifyContent="space-between" mt={3}>
                        <Button onClick={handleSaveReceipt} variant="contained" color="primary">Save</Button>
                        <Button onClick={closeModal} variant="outlined" color="secondary">Cancel</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default CustomerReceipt;
