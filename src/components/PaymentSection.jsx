import React, { useState, useEffect } from 'react';
import qz from 'qz-tray'; // Import QZ Tray for printer connection
import '../utility/PaymentSection.css'; // Import your CSS for styling

function PaymentSection({ total, onClose, onPaymentComplete }) {
    const [selectedMethod, setSelectedMethod] = useState('CASH');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const paymentMethods = ['CASH', 'CARD'];

    // Connect to QZ Tray when the component mounts
    useEffect(() => {
        const connectToQZTray = async () => {
            if (isConnected || isConnecting) return; // Prevent multiple connections

            try {
                setIsConnecting(true);
                await qz.websocket.connect();
                setIsConnected(true);
                console.log("Connected to QZ Tray");
            } catch (err) {
                console.error("Error connecting to QZ Tray:", err);
            } finally {
                setIsConnecting(false);
            }
        };

        connectToQZTray();

        // Clean up the connection when the component unmounts
        return () => {
            if (isConnected) {
                qz.websocket.disconnect().then(() => {
                    setIsConnected(false);
                    console.log("Disconnected from QZ Tray");
                }).catch(err => console.error("Error disconnecting from QZ Tray:", err));
            }
        };
    }, [isConnected, isConnecting]);

    const handleMethodChange = (method) => {
        setSelectedMethod(method);
        setAmount('');
        setBalance(0);
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
            // Append the value from the keypad to the amount
            setAmount(prev => prev + value);
        }
    };

    const handlePaymentCompletion = () => {
        // Only proceed if the amount is entered
        if (amount) {
            const parsedAmount = parseFloat(amount || '0');
            const calculatedBalance = parsedAmount - parseFloat(total);

            onPaymentComplete({
                method: selectedMethod,
                amountPaid: parsedAmount.toFixed(3),
                balance: calculatedBalance.toFixed(3),
            });

            // Print the receipt if connected
            if (isConnected) {
                handlePrintReceipt();
            } else {
                console.error("Cannot print, not connected to QZ Tray");
            }

            // Close the modal after completing payment
            onClose();
        } else {
            alert('Please enter the payment amount.');
        }
    };

    const handlePrintReceipt = () => {
        if (!isConnected) {
            console.error("Cannot print, not connected to QZ Tray");
            return;
        }

        const config = qz.configs.create("RONGTA 80mm Series Printer"); // Replace with your printer name

        // Define the print data with ESC/POS commands for thermal printers
        const data = [
            '\x1B\x40', // Initialize printer
            '\x1B\x21\x08', // Bold text
            'Receipt\n',
            '\x1B\x21\x00', // Normal text
            '--------------------------\n',
            `Total: ${parseFloat(total).toFixed(3)} OMR\n`,
            `Paid: ${parseFloat(amount).toFixed(3)} OMR\n`,
            `Balance: ${balance.toFixed(3)} OMR\n`,
            '--------------------------\n',
            'Thank you for your purchase!\n',
            '\x1B\x64\x03', // Feed 3 lines to ensure the print is clear
            '\x1D\x56\x41', // Cut paper after the content
        ];

        qz.print(config, data).then(() => {
            console.log("Printed successfully");
        }).catch(err => console.error("Print failed:", err));
    };

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
                <div className="keypad" style={{padding: '0px'}}>
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
                        <button onClick={handlePrintReceipt} style={{ background: 'blue' }}>Print</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentSection;
