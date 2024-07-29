import React, { useEffect, useState, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Invoices() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [printOption, setPrintOption] = useState('latest10'); // Default print option
    const [showPrintDialog, setShowPrintDialog] = useState(false); // State to manage the print dialog visibility
    const [shopDetails, setShopDetails] = useState({}); // State to store shop details

    useEffect(() => {
        const fetchOrders = async () => {
            const orderCollection = collection(db, 'orders');
            const orderSnapshot = await getDocs(orderCollection);
            const allOrders = orderSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(order => order.addedBy === currentUser.uid)
                .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            setOrders(allOrders);
        };

        const fetchShopDetails = async () => {
            if (currentUser) {
                const shopDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (shopDoc.exists()) {
                    setShopDetails(shopDoc.data());
                }
            }
        };

        fetchOrders();
        fetchShopDetails();
    }, [currentUser]);

    const handlePrint = () => {
        let ordersToPrint = [];

        if (printOption === 'latest10') {
            ordersToPrint = orders.slice(0, 10);
        } else if (printOption === 'all') {
            ordersToPrint = orders;
        }

        const totalAmount = ordersToPrint.reduce((acc, order) => acc + parseFloat(order.total), 0);

        const printContent = `
            <style>
                .bill-container {
                    font-family: 'Arial', sans-serif;
                    // width: 80mm;
                    padding: 10px;
                    border: 1px solid #ccc;
                    margin: auto;
                }
                .bill-header {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .bill-header h2, .bill-header p {
                    margin: 0;
                }
                .bill-items, .transactions {
                    width: 100%;
                    border-collapse: collapse;
                }
                .bill-items th, .bill-items td, .transactions th, .transactions td {
                    border: 1px solid #ccc;
                    padding: 5px;
                    text-align: left;
                }
                .bill-summary {
                    margin-top: 10px;
                    width: 100%;
                    text-align: right;
                }
                .bill-footer {
                    margin-top: 10px;
                    text-align: center;
                }
            </style>
            <div class="bill-container">
                <div class="bill-header">
                    ${shopDetails.logoUrl ? `<img src="${shopDetails.logoUrl}" alt="Logo" style="width: 50px; height: 50px;"/>` : ''}
                    <h3>TechERP</h3>
                    <p>${shopDetails.address}</p>
                    <p>${shopDetails.phone}</p>
                    <h2>${shopDetails.name}</h2>
                    <p>Invoice</p>
                    <p>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                </div>
                <table class="bill-items">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total (OMR)</th>
                            <th>Status</th>
                            <th>Items</th>
                            <th>Discount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersToPrint.map(order => `
                            <tr>
                                <td>${order.orderId}</td>
                                <td>${new Date(order.timestamp.toDate()).toLocaleDateString()} ${new Date(order.timestamp.toDate()).toLocaleTimeString()}</td>
                                <td>${parseFloat(order.total).toFixed(3)}</td>
                                <td>${order.status}</td>
                                <td>
                                    <ul>
                                        ${order.cart.map(item => `
                                            <li>${item.name} - Qty: ${item.quantity}</li>
                                        `).join('')}
                                    </ul>
                                </td>
                                <td>${parseFloat(order.discount).toFixed(3)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="bill-summary">
                    <p>Total Amount: ${totalAmount.toFixed(3)} OMR</p>
                </div>
                <div class="bill-footer">
                    <p>Signature:</p>
                    <p>No CASH REFUND</p>
                    <p>NO EXCHANGE</p>
                </div>
            </div>
        `;

        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="invoices-container">
            <h2>Last 10 Orders</h2>
            <ul className="orders-list">
                {orders.slice(0, 10).map((order) => (
                    <li key={order.id} className="order-item">
                        {new Date(order.timestamp.toDate()).toLocaleDateString()} - {parseFloat(order.total).toFixed(3)} OMR - {order.status} - {order.cart.map(item => `${item.name} (${item.quantity})`).join(', ')} - Discount: {parseFloat(order.discount).toFixed(3)}
                    </li>
                ))}
            </ul>
            <button onClick={() => setShowPrintDialog(true)}>Print Orders</button>

            {showPrintDialog && (
                <div className="print-dialog">
                    <h3>Select Print Option</h3>
                    <div>
                        <label>
                            <input
                                type="radio"
                                name="printOption"
                                value="latest10"
                                checked={printOption === 'latest10'}
                                onChange={() => setPrintOption('latest10')}
                            />
                            Latest 10 Orders
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="radio"
                                name="printOption"
                                value="all"
                                checked={printOption === 'all'}
                                onChange={() => setPrintOption('all')}
                            />
                            All Orders
                        </label>
                    </div>
                    <button onClick={handlePrint}>Print</button>
                    <button onClick={() => setShowPrintDialog(false)}>Cancel</button>
                </div>
            )}
        </div>
    );
}

export default Invoices;
