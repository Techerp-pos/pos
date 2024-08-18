import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../utility/ViewList.css'
const ViewList = () => {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const purchaseOrdersRef = collection(db, 'purchaseOrders');
                const goodsReceiveNotesRef = collection(db, 'goodsReceiveNotes');

                const purchaseOrdersSnapshot = await getDocs(query(purchaseOrdersRef));
                const goodsReceiveNotesSnapshot = await getDocs(query(goodsReceiveNotesRef));

                const purchaseOrders = purchaseOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), orderType: 'LPO' }));
                const goodsReceiveNotes = goodsReceiveNotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), orderType: 'GRN' }));

                const combinedRecords = [...purchaseOrders, ...goodsReceiveNotes];

                // Sorting by date, you can modify this depending on your requirement
                combinedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

                setRecords(combinedRecords);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
        };

        fetchRecords();
    }, []);

    return (
        <div className="view-list">
            <h2>Purchases</h2>
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
                            <td>{record.date ? new Date(record.date.seconds * 1000).toLocaleDateString() : ''}</td>
                            <td>{record.invoiceNumber}</td>
                            <td>{record.vendor}</td>
                            <td>{record.orderType}</td>
                            <td>{record.status}</td>
                            <td>{record.finalAmount}</td>
                            <td>
                                <button onClick={() => handleEdit(record.id, record.orderType)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewList;
