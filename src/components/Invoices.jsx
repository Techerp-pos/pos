import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, orderBy, limit } from 'firebase/firestore';

function Invoices() {
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        const fetchInvoices = async () => {
            const invoiceCollection = collection(db, 'invoices');
            const invoiceSnapshot = await getDocs(invoiceCollection, orderBy('date', 'desc'), limit(10));
            setInvoices(invoiceSnapshot.docs.map(doc => doc.data()));
        };

        fetchInvoices();
    }, []);

    return (
        <div>
            <h2>Last 10 Days Invoices</h2>
            <ul>
                {invoices.map((invoice, index) => (
                    <li key={index}>{invoice.date} - ${invoice.amount}</li>
                ))}
            </ul>
        </div>
    );
}

export default Invoices;
