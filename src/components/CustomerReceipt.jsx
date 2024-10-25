import React, { useState, useEffect } from 'react';
import { TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Modal, Box, Typography, FormControl, InputLabel, Select, MenuItem, Snackbar, CircularProgress } from '@mui/material';
import moment from 'moment';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, doc, writeBatch, setDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { Alert } from '@mui/material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../utility/CustomerReceipt.css'
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
    const [orderPayments, setOrderPayments] = useState({}); // New state for "To Receive" and "Discount" per order
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Control MUI dialog visibility
    const [transactionToDelete, setTransactionToDelete] = useState(null); // Store transaction to delete

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // Fetch all customer transactions
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'customerReceipts'), (snapshot) => {
            const transactionList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(transactionList);
            setFilteredTransactions(transactionList);
            setIsLoading(false);
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
            const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
                const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const filteredOrders = orderList.filter(order => order.cashPaid !== true);
                setOrders(filteredOrders);
            });
            return () => unsubscribe();
        }
    };

    const handleOrderSelection = (order, isSelected) => {
        let updatedSelectedOrders = [...selectedOrders];
        let updatedOrderPayments = { ...orderPayments };

        if (isSelected) {
            updatedSelectedOrders.push(order);
            updatedOrderPayments[order.id] = {
                toReceive: parseFloat(order.total || 0), // Initialize with the full amount
                discount: 0 // Initialize discount as 0
            };
        } else {
            updatedSelectedOrders = updatedSelectedOrders.filter(o => o.id !== order.id);
            delete updatedOrderPayments[order.id];
        }

        setSelectedOrders(updatedSelectedOrders);
        setOrderPayments(updatedOrderPayments);
        recalculateFooterTotals(updatedOrderPayments); // Recalculate footer totals
    };

    const handlePaymentChange = (orderId, field, value) => {
        let updatedOrderPayments = { ...orderPayments };
        updatedOrderPayments[orderId][field] = parseFloat(value) || 0;

        setOrderPayments(updatedOrderPayments);
        recalculateFooterTotals(updatedOrderPayments);
    };

    const recalculateFooterTotals = (orderPayments) => {
        const totalToReceive = Object.values(orderPayments).reduce((sum, order) => sum + order.toReceive, 0);
        const totalDiscount = Object.values(orderPayments).reduce((sum, order) => sum + order.discount, 0);
        const totalPaid = totalToReceive - totalDiscount;

        setTotalToReceive(totalToReceive);
        setDiscount(totalDiscount);
        setPaid(totalPaid);
        setBalance(totalToReceive - totalPaid - totalDiscount);
    };

    const handleSaveReceipt = async () => {
        try {
            const voucherNumber = await generateNumericVoucherNumber();
            const newVoucherRef = doc(collection(db, 'customerReceipts'));

            // Prepare receipt data to save
            const receiptData = {
                voucherNumber: voucherNumber || 1000,
                date: transactionDate.format('YYYY-MM-DD'),
                customer: selectedCustomer?.name || 'Unknown',
                totalAmount: parseFloat(totalToReceive) || 0,
                paymentType: account || 'cash',
                discount: parseFloat(discount) || 0,  // Overall transaction discount
                paid: parseFloat(paid) || 0,  // Amount paid for the transaction
                balance: parseFloat(balance) || 0,  // Remaining balance after payment
                paidOrderDetails: selectedOrders.length > 0
                    ? selectedOrders.map(order => ({
                        orderId: order.orderNumber,
                        total: parseFloat(order.total) || 0,
                        toReceive: orderPayments[order.id]?.toReceive || 0,
                        discount: orderPayments[order.id]?.discount || 0,
                        balance: orderPayments[order.id]?.toReceive - orderPayments[order.id]?.discount // Calculated balance for each order
                    }))
                    : []
            };

            // Save the receipt data to Firestore
            await setDoc(newVoucherRef, receiptData);

            // Use Firestore batch to update each selected order
            const batch = writeBatch(db);

            selectedOrders.forEach(order => {
                const orderRef = doc(db, 'orders', order.id);

                // Calculate the balance and discount directly from the receiptData's paidOrderDetails
                const orderReceipt = receiptData.paidOrderDetails.find(o => o.orderId === order.orderNumber);
                const receiptBalance = orderReceipt?.balance || 0;  // Use balance from receiptData
                const receiptDiscount = orderReceipt?.discount || 0;  // Use discount from receiptData

                // Update the order document fields
                batch.update(orderRef, {
                    CashReceipt: orderReceipt.toReceive, // Use the 'toReceive' value from the receipt
                    cashPaid: receiptBalance === 0 ? true : false, // If balance is 0, mark cashPaid as true
                    CashBalance: receiptBalance, // Set the balance for the order from the receipt
                    receiptDiscount: receiptDiscount // Add the receipt discount to the order document
                });
            });

            // Commit the batch updates
            await batch.commit();

            // Reset all states after saving
            setSelectedCustomer(null);
            setPaid(0);
            setDiscount(0);
            setSelectedOrders([]);
            setTransactionDate(moment());
            setVoucherNumber('AUTO');
            setAccount('');
            setBalance(0);

            closeModal();
        } catch (error) {
            console.error("Error saving receipt:", error);
        }
    };

    // Function to handle printing the receipt as PDF
    const handlePrintReceipt = (transaction) => {
        const doc = new jsPDF();

        // Header Section
        doc.setFontSize(18);
        doc.text('Customer Receipt', 105, 20, { align: 'center' });

        // Customer and Voucher Information
        doc.setFontSize(12);
        doc.text(`Voucher Number: ${transaction.voucherNumber}`, 20, 40);
        doc.text(`Customer: ${transaction.customer}`, 20, 50);
        doc.text(`Date: ${transaction.date}`, 20, 60);
        doc.text(`Total Amount: ${transaction.totalAmount?.toFixed(3)} OMR`, 20, 70);
        doc.text(`Payment Type: ${transaction.paymentType}`, 20, 80);

        // Table for Order Details
        if (transaction.paidOrderDetails && transaction.paidOrderDetails.length > 0) {
            const tableData = transaction.paidOrderDetails.map((order) => [
                order.orderId,
                order?.total.toFixed(3),
                order?.CashReceipt.toFixed(3),
                order?.receiptDiscount.toFixed(3),
                order?.CashBalance.toFixed(3),
            ]);

            doc.autoTable({
                head: [['Order ID', 'Total (OMR)', 'Received (OMR)', 'Discount (OMR)', 'Balance (OMR)']],
                body: tableData,
                startY: 90,
                styles: {
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 10,
                },
                headStyles: {
                    fillColor: [22, 160, 133], // Custom table header color
                    textColor: [255, 255, 255],
                },
            });
        }

        // Footer Section
        doc.setFontSize(12);
        doc.text('Thank you for your business!', 105, doc.lastAutoTable.finalY + 20, { align: 'center' });

        // Save the PDF
        doc.save(`receipt_${transaction.voucherNumber}.pdf`);
    };


    const handleDeleteTransaction = async (transaction) => {
        setDeleteDialogOpen(false); // Close the delete confirmation dialog

        try {
            // Delete the transaction from the 'customerReceipts' collection
            await deleteDoc(doc(db, 'customerReceipts', transaction.id));

            const batch = writeBatch(db); // Use a batch to ensure all updates happen atomically

            // Iterate over the related orders and revert the changes made by this transaction
            transaction.paidOrderDetails.forEach(order => {
                const orderRef = doc(db, 'orders', order.orderId);

                // Update each order to reset the cash-related fields
                batch.update(orderRef, {
                    CashReceipt: 0, // Reset the cash receipt field to 0
                    cashPaid: false, // Mark the order as unpaid
                    CashBalance: parseFloat(order.total) || 0 // Revert the balance to the original total
                });
            });

            // Commit the batch updates
            await batch.commit();

            // Provide feedback through a snackbar or similar UI element
            setSnackbarMessage('Transaction deleted, and all related changes have been reverted.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);

        } catch (error) {
            // Handle errors if something goes wrong
            console.error('Error deleting transaction and reverting changes:', error);
            setSnackbarMessage('Error occurred while deleting the transaction.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const generateNumericVoucherNumber = async () => {
        const latestVoucherSnapshot = await getDocs(collection(db, 'customerReceipts'));
        const voucherList = latestVoucherSnapshot.docs
            .map(doc => parseInt(doc.data().voucherNumber, 10))
            .filter(voucherNumber => !isNaN(voucherNumber));

        const maxVoucherNumber = voucherList.length > 0 ? Math.max(...voucherList) : 1000;
        return (maxVoucherNumber + 1).toString().padStart(4, '0');
    };

    const openModal = (type) => {
        // Clear all relevant states
        setOrders([]);                 // Clear all loaded orders
        setSelectedOrders([]);          // Clear selected orders
        setOrderPayments({});           // Clear order payment details
        setTotalToReceive(0);           // Reset total to receive
        setDiscount(0);                 // Reset discount
        setPaid(0);                     // Reset paid amount
        setBalance(0);                  // Reset balance

        // Set the account type and open the modal
        setAccount(type);
        setIsModalOpen(true);
    };


    const closeModal = () => {
        setIsModalOpen(false);
        setOrders([]);                 // Clear all loaded orders
        setSelectedCustomer(null);      // Clear selected customer
        setSelectedOrders([]);          // Clear selected orders
        setOrderPayments({});           // Clear order payment details
        setTotalToReceive(0);           // Reset total to receive
        setDiscount(0);                 // Reset discount
        setPaid(0);                     // Reset paid amount
        setBalance(0);                  // Reset balance
    };

    return (
        <div style={{ padding: '20px' }}>
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

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </div>
            ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Voucher Number</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Total Amount</TableCell>
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
                                <TableCell>{transaction.totalAmount?.toFixed(3)} OMR</TableCell>
                                <TableCell>{transaction.paid?.toFixed(3)} OMR</TableCell>
                                <TableCell>{transaction.balance?.toFixed(3)} OMR</TableCell>
                                <TableCell>
                                    <div style={{
                                        display: 'flex', gap: '10px'
                                    }}>
                                        <Button variant="contained" color="primary" onClick={() => handlePrintReceipt(transaction)}>
                                            Print
                                        </Button>
                                        <Button variant="contained" color="primary" onClick={() => handleDeleteTransaction(transaction)}>
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {isModalOpen && (
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

                        {selectedCustomer && orders.length > 0 && (
                            <Box sx={{ maxHeight: '300px', overflowY: 'scroll', mt: 3 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Select</TableCell>
                                            <TableCell>Invoice Number</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Total</TableCell>
                                            <TableCell>To Receive</TableCell>
                                            <TableCell>Discount</TableCell>
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
                                                <TableCell>
                                                    <TextField
                                                        value={orderPayments[order.id]?.toReceive || ''}
                                                        onChange={(e) => handlePaymentChange(order.id, 'toReceive', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        value={orderPayments[order.id]?.discount || ''}
                                                        onChange={(e) => handlePaymentChange(order.id, 'discount', e.target.value)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}

                        <Box display="flex" gap={2} mt={2}>
                            <TextField label="To Receive" value={totalToReceive?.toFixed(3)} fullWidth readOnly />
                            <TextField label="Discount" value={discount?.toFixed(3)} fullWidth readOnly />
                            <TextField label="Received" value={paid?.toFixed(3)} fullWidth readOnly />
                            <TextField label="Balance" value={balance.toFixed(3)} fullWidth readOnly />
                        </Box>

                        <Box display="flex" justifyContent="space-between" mt={3} width='900px'>
                            <Button onClick={handleSaveReceipt} variant="contained" color="primary">Save</Button>
                            <Button onClick={closeModal} variant="outlined" color="secondary">Cancel</Button>
                        </Box>
                    </Box>
                </Modal>
            )}
        </div>
    );
}

export default CustomerReceipt;
