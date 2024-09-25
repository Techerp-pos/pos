// SaleHistory.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../utility/SaleHistory.css';

function SaleHistory({ onClose, onOpenOrder }) {
    const { currentUser } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const salesQuery = query(
            collection(db, 'orders'),
            where('shopCode', '==', currentUser.shopCode),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
            const salesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSales(salesList);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching sales history:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser.shopCode]);

    // Define handlePrint function
    const handlePrint = (sale) => {
        // Implement printing logic here
        alert(`Printing sale with order number: ${sale.orderNumber}`);
    };

    // Define handleDownload function
    const handleDownload = (sale) => {
        // Implement download logic here
        alert(`Downloading sale with order number: ${sale.orderNumber}`);
    };

    return (
        <div className="sale-history-modal">
            <div className="sale-history-content">
                <div className="sale-history-header">
                    <h2>Sale History</h2>
                    <button onClick={onClose}>X</button>
                </div>
                <table className="sale-history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice Number</th>
                            <th>Customer</th>
                            <th>Terminal</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6">Loading...</td></tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>{new Date(sale.timestamp?.seconds * 1000).toLocaleDateString()}</td>
                                    <td>{sale.orderNumber}</td>
                                    <td>{sale.customer || 'N/A'}</td>
                                    <td>{sale.terminal || 'SALE'}</td>
                                    <td>{parseFloat(sale.total).toFixed(3)} OMR</td>
                                    <td>
                                        <button onClick={() => handlePrint(sale)}>Print</button>
                                        <button onClick={() => handleDownload(sale)}>Download</button>
                                        {typeof onOpenOrder === 'function' ? (
                                            <button onClick={() => onOpenOrder(sale)}>Update</button>
                                        ) : (
                                            <button disabled>Open</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SaleHistory;
