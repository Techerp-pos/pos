import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import qz from 'qz-tray';
import '../utility/SaleHistory.css';

function SaleHistory({ onClose, onOpenOrder }) {
    const { currentUser } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shopDetails, setShopDetails] = useState(null);

    useEffect(() => {
        const salesQuery = query(
            collection(db, 'orders'),
            where('shopCode', '==', currentUser.shopCode)
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

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (currentUser?.shopCode) {
                const shopQuery = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
                const shopSnapshot = await getDocs(shopQuery);
                if (!shopSnapshot.empty) {
                    setShopDetails(shopSnapshot.docs[0].data());
                }
            }
        };

        fetchShopDetails();
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
                                        <button onClick={() => handlePrint(sale)}>Print</button>
                                        <button onClick={() => handleDownload(sale)}>Download</button>
                                        <button onClick={() => onOpenOrder(sale)}>Open</button>
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
