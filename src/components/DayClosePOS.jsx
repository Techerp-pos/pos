import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import '../utility/DayClosePOS.css';

function DayClosePOS() {
    const [cashSummary, setCashSummary] = useState({
        currency: "OMR",
        cashOpening: 0.000,
        transactions: 0.000,
        cashInHand: 0.000,
    });
    const [saleSummary, setSaleSummary] = useState({
        cash: 0.000,
        credit: 0.000,
        adjustedAdvance: 0.000,
        tax: 0.000,
        total: 0.000,
    });
    const [variance, setVariance] = useState({
        currency: "OMR",
        open: 0.000,
        transaction: 0.000,
        close: 0.000,
        variance: 0.000,
    });

    useEffect(() => {
        const fetchDayCloseData = async () => {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            // Query orders for today
            const ordersRef = collection(db, 'orders');
            const todayQuery = query(
                ordersRef,
                where('timestamp', '>=', startOfDay),
                where('timestamp', '<=', endOfDay)
            );

            const snapshot = await getDocs(todayQuery);
            let cashTotal = 0.000;
            let creditTotal = 0.000;
            let taxTotal = 0.000;
            let grandTotal = 0.000;

            snapshot.forEach((doc) => {
                const order = doc.data();
                if (order.paymentMethod === 'CASH') {
                    cashTotal += parseFloat(order.total);
                } else if (order.paymentMethod === 'CREDIT') {
                    creditTotal += parseFloat(order.total);
                }
                taxTotal += parseFloat(order.tax || 0);
                grandTotal += parseFloat(order.total);
            });

            setSaleSummary({
                cash: cashTotal,
                credit: creditTotal,
                adjustedAdvance: 0.000, // Placeholder for advanced payments if applicable
                tax: taxTotal,
                total: grandTotal,
            });

            setCashSummary(prev => ({
                ...prev,
                transactions: cashTotal,
                cashInHand: prev.cashOpening + cashTotal,
            }));

            setVariance({
                currency: "OMR",
                open: 0.000,
                transaction: cashTotal,
                close: 0.000,
                variance: -cashTotal,
            });
        };

        fetchDayCloseData();
    }, []);

    const handleCloseDay = async () => {
        try {
            await addDoc(collection(db, 'dayClose'), {
                cashSummary,
                saleSummary,
                variance,
                timestamp: serverTimestamp(),
            });
            alert("Day closed successfully!");
        } catch (error) {
            console.error("Error closing day: ", error);
            alert("Failed to close the day. Please try again.");
        }
    };

    return (
        <div className="day-close-modal">
            <div className="day-close-content">
                <h2>Day Close Summary</h2>

                <div className="summary-section">
                    <div className="cash-summary">
                        <h3>Cash Summary</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Currency</th>
                                    <th>Amount</th>
                                    <th>Ex Rate</th>
                                    <th>Net Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{cashSummary.currency}</td>
                                    <td>{cashSummary.cashOpening.toFixed(2)}</td>
                                    <td>1.00</td>
                                    <td>{(cashSummary.cashOpening * 1).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>{cashSummary.currency}</td>
                                    <td>{cashSummary.transactions.toFixed(2)}</td>
                                    <td>1.00</td>
                                    <td>{(cashSummary.transactions * 1).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>{cashSummary.currency}</td>
                                    <td>{cashSummary.cashInHand.toFixed(2)}</td>
                                    <td>1.00</td>
                                    <td>{(cashSummary.cashInHand * 1).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="sale-summary">
                        <h3>Sale Summary</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Pay Code</th>
                                    <th>Net Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>CASH</td>
                                    <td>{saleSummary.cash.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>CREDIT</td>
                                    <td>{saleSummary.credit.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Advance(Adjusted)</td>
                                    <td>{saleSummary.adjustedAdvance.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>TAX</td>
                                    <td>{saleSummary.tax.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>{saleSummary.total.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="variance-summary">
                    <h3>Variance</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Open</th>
                                <th>Transaction</th>
                                <th>Close</th>
                                <th>Variance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{variance.currency}</td>
                                <td>{variance.open.toFixed(2)}</td>
                                <td>{variance.transaction.toFixed(2)}</td>
                                <td>{variance.close.toFixed(2)}</td>
                                <td>{variance.variance.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <button onClick={handleCloseDay} className="close-day-button">Close Day</button>
            </div>
        </div>
    );
}

export default DayClosePOS;
