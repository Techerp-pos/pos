import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../utility/SaleHistory.css';

function SaleHistory({ onClose }) {
    const { currentUser } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Create a query to fetch only the orders with the current user's shopCode
        const salesQuery = query(
            collection(db, 'orders'),
            where('shopCode', '==', currentUser.shopCode)
        );

        // Listen for real-time updates using onSnapshot
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

        // Cleanup the subscription on component unmount
        return () => unsubscribe();
    }, [currentUser.shopCode]);

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
                            sales.map((sale, index) => (
                                <tr key={sale.id}>
                                    <td>{new Date(sale.timestamp?.seconds * 1000).toLocaleDateString()}</td>
                                    <td>{sale.invoiceNumber || `100${index + 1}`}</td>
                                    <td>{sale.customer || 'N/A'}</td>
                                    <td>{sale.terminal || 'SALE'}</td>
                                    <td>{parseFloat(sale.total).toFixed(3)} OMR</td>
                                    <td>
                                        <button onClick={() => alert('Print')}>Print</button>
                                        <button onClick={() => alert('Download')}>Download</button>
                                        <button onClick={() => alert('View')}>View</button>
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
