import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../utility/DayClosePOS.css';
import { Navigate, useNavigate } from 'react-router-dom';

function DayClosePOS() {

    const navigate = useNavigate()
    const [cashSummary, setCashSummary] = useState({
        currency: "OMR",
        cashOpening: 0.000,
        transactions: 0.000,
        cashInHand: 0.000,
    });
    const [creditSummary, setCreditSummary] = useState({
        currency: "OMR",
        totalCredit: 0.000,
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

            snapshot.forEach((doc) => {
                const order = doc.data();
                if (order.paymentMethod === 'CASH') {
                    cashTotal += parseFloat(order.total);
                } else if (order.paymentMethod === 'CREDIT') {
                    creditTotal += parseFloat(order.total);
                }
            });

            setCashSummary(prev => ({
                ...prev,
                transactions: cashTotal,
                cashInHand: prev.cashOpening + cashTotal,
            }));

            setCreditSummary(prev => ({
                ...prev,
                totalCredit: creditTotal,
            }));
        };

        fetchDayCloseData();
    }, []);

    const handleCloseDay = async () => {
        try {
            console.log("Cash Summary: ", cashSummary);
            console.log("Credit Summary: ", creditSummary);

            // Basic validation of required fields
            if (!cashSummary || !creditSummary) {
                throw new Error("Missing required cash or credit summary data");
            }

            await addDoc(collection(db, 'dayClose'), {
                cashSummary,
                creditSummary,
                timestamp: serverTimestamp(),
            });

            alert("Day closed successfully!");

        } catch (error) {
            console.error("Error closing day: ", error);
            alert(`Failed to close the day. Error: ${error.message}`);
        }

        navigate('/pos')
    };


    // Function to download PDF
    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text('Day Close Summary', 20, 10);
        doc.autoTable({
            head: [['Currency', 'Cash Opening', 'Cash Transactions', 'Cash in Hand']],
            body: [
                [
                    cashSummary.currency,
                    cashSummary.cashOpening.toFixed(2),
                    cashSummary.transactions.toFixed(2),
                    cashSummary.cashInHand.toFixed(2),
                ]
            ],
        });
        doc.autoTable({
            head: [['Currency', 'Credit Total']],
            body: [
                [
                    creditSummary.currency,
                    creditSummary.totalCredit.toFixed(2)
                ]
            ],
        });
        doc.save('DayCloseSummary.pdf');
    };

    // Function to download Excel
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet([{
            Currency: cashSummary.currency,
            'Cash Opening': cashSummary.cashOpening.toFixed(2),
            'Cash Transactions': cashSummary.transactions.toFixed(2),
            'Cash in Hand': cashSummary.cashInHand.toFixed(2),
            'Credit Total': creditSummary.totalCredit.toFixed(2),
        }]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Day Close Summary');
        XLSX.writeFile(workbook, 'DayCloseSummary.xlsx');
    };

    return (
        <div className="day-close-modal">
            <div className="day-close-content">
                <h2>Day Close Summary</h2>

                {/* Cash Summary Card */}
                <div className="cash-summary">
                    <h3>Cash Summary</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Cash Opening</th>
                                <th>Cash Transactions</th>
                                <th>Cash in Hand</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{cashSummary.currency}</td>
                                <td>{cashSummary.cashOpening.toFixed(2)}</td>
                                <td>{cashSummary.transactions.toFixed(2)}</td>
                                <td>{cashSummary.cashInHand.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Credit Summary Card */}
                <div className="credit-summary">
                    <h3>Credit Summary</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Credit Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{creditSummary.currency}</td>
                                <td>{creditSummary.totalCredit.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="download-buttons">
                    <button onClick={downloadPDF} className="download-button">Download PDF</button>
                    <button onClick={downloadExcel} className="download-button">Download Excel</button>
                </div>

                <button onClick={handleCloseDay} className="close-day-button">Close Day</button>
            </div>
        </div>
    );
}

export default DayClosePOS;
