import React, { useState, useEffect, useContext } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Grid } from '@mui/material';
import '../utility/PaymentSection.css';
import { QZTrayContext } from '../contexts/QzTrayContext';
import PropTypes from 'prop-types';

function PaymentSection({ total, onClose, onPaymentComplete, shopDetails }) {
    const { isConnected, availablePrinters } = useContext(QZTrayContext);
    const [selectedMethod, setSelectedMethod] = useState('CASH');
    const [amount, setAmount] = useState('');
    const [remainingAmount, setRemainingAmount] = useState(parseFloat(total)); // Track remaining to be paid
    const [change, setChange] = useState(0); // Track change if overpaid
    const [paymentSummary, setPaymentSummary] = useState([]); // Holds payment details for each method
    const [readyToSettle, setReadyToSettle] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState(shopDetails?.defaultPrinter || '');

    const paymentMethods = ['CASH', 'CARD', 'CREDIT'];

    useEffect(() => {
        if (shopDetails?.defaultPrinter) {
            setSelectedPrinter(shopDetails.defaultPrinter);
        }
    }, [shopDetails]);

    const handleMethodChange = (method) => {
        setSelectedMethod(method);
        setAmount(''); // Reset amount when switching method
    };

    const handleKeypadClick = (value) => {
        if (value === 'Enter') {
            const parsedAmount = parseFloat(amount || '0');
            const totalPaid = paymentSummary.reduce((acc, payment) => acc + payment.amount, 0); // Sum of all entered payments
            const newTotalPaid = totalPaid + parsedAmount; // Total paid with the current amount
            const newRemainingAmount = parseFloat(total) - newTotalPaid;

            if (parsedAmount > 0) {
                if (newRemainingAmount >= 0) {
                    // Add payment method and amount
                    const newSummary = [...paymentSummary, { method: selectedMethod, amount: parsedAmount }];
                    setPaymentSummary(newSummary);

                    // Update remaining amount
                    setRemainingAmount(newRemainingAmount);
                    setChange(0); // Reset change since no overpayment yet

                    // Reset amount input
                    setAmount('');

                    // Check if payment is settled
                    if (newRemainingAmount === 0) {
                        setReadyToSettle(true);
                    }
                } else {
                    // Overpayment - calculate change
                    const overpaidAmount = Math.abs(newRemainingAmount);
                    setChange(overpaidAmount);
                    setRemainingAmount(0);

                    // Add payment method and amount
                    setPaymentSummary([...paymentSummary, { method: selectedMethod, amount: parsedAmount }]);

                    // Reset amount input
                    setAmount('');
                    setReadyToSettle(true); // Ready to settle since fully paid
                }
            } else {
                alert('Please enter a valid amount.');
            }
        } else if (value === 'Clear') {
            setAmount('');
        } else {
            setAmount(prev => prev + value);
        }
    };

    const handlePaymentCompletion = () => {
        if (remainingAmount === 0) {
            onPaymentComplete({
                method: selectedMethod, // Add selected method here
                amountPaid: paymentSummary.reduce((sum, payment) => sum + payment.amount, 0), // Total paid
                balance: change, // Change (overpaid amount)
                summary: paymentSummary,
                totalPaid: total,
            });
            onClose();
        } else {
            alert('Please settle the full amount.');
        }
    };


    const handleRemovePayment = (index) => {
        const payment = paymentSummary[index];
        const updatedSummary = paymentSummary.filter((_, i) => i !== index);
        const newRemainingAmount = remainingAmount + payment.amount;
        setPaymentSummary(updatedSummary);
        setRemainingAmount(newRemainingAmount); // Adjust remaining amount
        setChange(0); // Reset change calculation
        setReadyToSettle(false); // Reset ready to settle
    };

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle style={{ backgroundColor: '#2196f3', color: 'white' }}>Payment</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {/* Payment Methods */}
                    <Grid item xs={3}>
                        {paymentMethods.map((method) => (
                            <Button
                                key={method}
                                variant={selectedMethod === method ? 'contained' : 'outlined'}
                                color={selectedMethod === method ? 'warning' : 'default'}
                                fullWidth
                                onClick={() => handleMethodChange(method)}
                                style={{ marginBottom: '10px', fontSize: '16px', height: '60px' }}
                            >
                                {method}
                            </Button>
                        ))}
                    </Grid>

                    {/* Amount and Balance Section */}
                    <Grid item xs={5}>
                        <Typography variant="h5" gutterBottom>
                            Total: {parseFloat(total).toFixed(3)} OMR
                        </Typography>

                        {/* To Pay Section */}
                        <Typography variant="h6" gutterBottom style={{ color: 'red' }}>
                            To Pay: {remainingAmount.toFixed(3)} OMR
                        </Typography>

                        <TextField
                            variant="outlined"
                            label="Amount"
                            fullWidth
                            value={amount}
                            InputProps={{ readOnly: true }}
                            style={{ marginBottom: '10px' }}
                        />
                        <TextField
                            variant="outlined"
                            label={change > 0 ? "Change" : "Balance"} // Dynamically show Balance or Change
                            fullWidth
                            value={change > 0 ? change.toFixed(3) : remainingAmount.toFixed(3)}
                            InputProps={{ readOnly: true }}
                            style={{ marginBottom: '10px' }}
                        />
                    </Grid>

                    {/* Keypad */}
                    <Grid item xs={4}>
                        <Grid container spacing={1}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'Enter'].map((key) => (
                                <Grid item xs={4} key={key}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => handleKeypadClick(key)}
                                        style={{ height: '60px', fontSize: '18px' }}
                                    >
                                        {key}
                                    </Button>
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => handleKeypadClick('Clear')}
                                    color="error"
                                    style={{ height: '60px', fontSize: '18px' }}
                                >
                                    Clear
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Payment Summary Section */}
                <Grid container spacing={2} style={{ marginTop: '20px' }}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Payment Summary:
                        </Typography>
                        <div style={{ backgroundColor: '#4a148c', padding: '10px', borderRadius: '5px' }}>
                            {paymentSummary.map((payment, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <Typography variant="body1" style={{ color: 'white' }}>
                                        {payment.method}: {payment.amount.toFixed(3)} OMR
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemovePayment(index)}
                                    >
                                        X
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Grid>
                </Grid>

            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handlePaymentCompletion}
                    variant="contained"
                    color="success"
                    style={{ fontSize: '18px', marginRight: '10px' }}
                >
                    Save & Print
                </Button>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="secondary"
                    style={{ fontSize: '18px' }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

PaymentSection.propTypes = {
    total: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onPaymentComplete: PropTypes.func.isRequired,
    shopDetails: PropTypes.object,
};

export default PaymentSection;
