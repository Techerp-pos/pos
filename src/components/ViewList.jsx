import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../utility/ViewList.css';

const ViewList = ({ orderType }) => {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                let collectionName = '';
                if (orderType === 'GRV') {
                    collectionName = 'goodsReturnVouchers';
                } else if (orderType === 'LPO') {
                    collectionName = 'purchaseOrders';
                } else if (orderType === 'GRN') {
                    collectionName = 'goodsReceiveNotes';
                } else {
                    console.error('Invalid order type');
                    return;
                }

                const ordersRef = collection(db, collectionName);
                const ordersSnapshot = await getDocs(query(ordersRef));
                const orders = ordersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    orderType
                }));

                // Sorting by date
                orders.sort((a, b) => new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000));

                setRecords(orders);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
        };

        fetchRecords();
    }, [orderType]);

    return (
        <div className="view-list">
            <h2>{orderType} List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Order Id</th>
                        <th>Date</th>
                        <th>Invoice Number</th>
                        <th>Vendor</th>
                        <th>Order Type</th>
                        <th>Status</th>
                        <th>Final Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : ''}</td>
                            <td>{record.invoiceNumber || 'N/A'}</td>
                            <td>{record.vendor || 'N/A'}</td>
                            <td>{record.orderType}</td>
                            <td>{record.status || 'N/A'}</td>
                            <td>{record.finalAmount || 'N/A'}</td>
                            <td>
                                <button>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewList;
