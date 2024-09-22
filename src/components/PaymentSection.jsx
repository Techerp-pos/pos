// PaymentSection.jsx
import React, { useState, useEffect, useContext } from 'react';
import qz from 'qz-tray';
import '../utility/PaymentSection.css';
import { QZTrayContext } from '../contexts/QzTrayContext'; // Ensure correct path
import PropTypes from 'prop-types'; // Optional: For prop type checking

function PaymentSection({ total, onClose, onPaymentComplete, shopDetails }) {
    const { isConnected, availablePrinters } = useContext(QZTrayContext); // Use context for connection status
    const [selectedMethod, setSelectedMethod] = useState('CASH');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState(0);
    const [selectedPrinter, setSelectedPrinter] = useState(shopDetails?.defaultPrinter || '');

    const paymentMethods = ['CASH', 'CARD'];

    useEffect(() => {
        if (shopDetails?.defaultPrinter) {
            setSelectedPrinter(shopDetails.defaultPrinter);
        }
    }, [shopDetails]);

    const handleMethodChange = (method) => {
        setSelectedMethod(method);
        setAmount('');
        setBalance(0);
    };

    const handlePrinterChange = (e) => {
        setSelectedPrinter(e.target.value);
    };

    const handleKeypadClick = (value) => {
        if (value === 'Enter') {
            const parsedAmount = parseFloat(amount || '0');
            const calculatedBalance = parsedAmount - parseFloat(total);
            setBalance(calculatedBalance);
        } else if (value === 'Clear') {
            setAmount('');
            setBalance(0);
        } else {
            setAmount(prev => prev + value);
        }
    };

    const handlePaymentCompletion = () => {
        if (amount) {
            const parsedAmount = parseFloat(amount || '0');
            const calculatedBalance = parsedAmount - parseFloat(total);

            onPaymentComplete({
                method: selectedMethod,
                amountPaid: parsedAmount.toFixed(3),
                balance: calculatedBalance.toFixed(3),
            });

            // if (isConnected) {
            //     handlePrintReceipt();
            // } else {
            //     console.error("Cannot print, not connected to QZ Tray");
            // }

            onClose();
        } else {
            alert('Please enter the payment amount.');
        }
    };

    // const handlePrintReceipt = () => {
    //     if (!isConnected) {
    //         console.error("Cannot print, not connected to QZ Tray");
    //         return;
    //     }

    //     if (!selectedPrinter) {
    //         alert("No printer selected. Please select a printer.");
    //         return;
    //     }

    //     // Initialize a new configuration using the selected printer
    //     const config = qz.configs.create(selectedPrinter);

    //     const data = [
    //         '\x1B\x40', // Initialize printer
    //         '\x1B\x21\x08', // Set double height
    //         'Receipt\n',
    //         '\x1B\x21\x00', // Reset text attributes
    //         '--------------------------\n',
    //         `Total: ${parseFloat(total).toFixed(3)} OMR\n`,
    //         `Paid: ${parseFloat(amount).toFixed(3)} OMR\n`,
    //         `Balance: ${balance.toFixed(3)} OMR\n`,
    //         '--------------------------\n',
    //         'Thank you for your purchase!\n',
    //         '\x1B\x64\x03', // Feed 3 lines
    //         '\x1D\x56\x41', // Full cut
    //     ];

    //     qz.print(config, data).then(() => {
    //         console.log("Printed successfully");
    //     }).catch(err => {
    //         console.error("Print failed:", err);
    //         alert("Failed to print the receipt. Please try again.");
    //     });
    // };

    return (
        <div className="payment-modal">
            <div className="payment-content">
                <div className="payment-header">
                    <h2>Payment</h2>
                    <button onClick={onClose}>X</button>
                </div>
                <p>Total: {parseFloat(total).toFixed(3)} OMR</p>
                <div className="payment-methods">
                    {paymentMethods.map(method => (
                        <button
                            key={method}
                            className={selectedMethod === method ? 'active' : ''}
                            onClick={() => handleMethodChange(method)}
                        >
                            {method}
                        </button>
                    ))}
                </div>
                <div className="payment-input">
                    <p>{selectedMethod}</p>
                    <input
                        type="text"
                        value={amount}
                        readOnly
                        placeholder="Enter amount"
                    />
                    <p style={{ fontSize: '16px' }}>Balance: {balance.toFixed(3)} OMR</p>
                </div>
                {!shopDetails?.defaultPrinter && (
                    <div className="printer-selection">
                        <label>Select Printer:</label>
                        <select value={selectedPrinter} onChange={handlePrinterChange}>
                            <option value="">-- Select Printer --</option>
                            {availablePrinters.map(printer => (
                                <option key={printer} value={printer}>
                                    {printer}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="keypad" style={{ padding: '0px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'Enter'].map(key => (
                        <button
                            key={key}
                            onClick={() => handleKeypadClick(key)}
                        >
                            {key}
                        </button>
                    ))}
                    <button onClick={() => handleKeypadClick('Clear')} style={{ background: 'red' }}>Clear</button>
                    <div className="payment-actions">
                        <button onClick={handlePaymentCompletion} style={{ background: 'green' }}>Complete</button>
                        {/* <button onClick={handlePrintReceipt} style={{ background: 'blue' }}>Print</button> */}
                    </div>
                </div>
            </div>
        </div>
    );
}

PaymentSection.propTypes = {
    total: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onPaymentComplete: PropTypes.func.isRequired,
    shopDetails: PropTypes.object, // Define the shape based on your data
};

export default PaymentSection;
