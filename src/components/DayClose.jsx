import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function DayClose() {
  const { currentUser } = useAuth();
  const [cashSales, setCashSales] = useState(0);
  const [cardSales, setCardSales] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [shopDetails, setShopDetails] = useState({});

  useEffect(() => {
    const fetchShopDetails = async () => {
      if (currentUser) {
        const shopDoc = await getDoc(doc(db, 'shopDetails', currentUser.uid));
        if (shopDoc.exists()) {
          setShopDetails(shopDoc.data());
        }
      }
    };

    const fetchDailySales = () => {
      const today = new Date().toISOString().split('T')[0];
      const q = query(collection(db, 'orders'), where('orderDate', '==', today), where('addedBy', '==', currentUser.uid));

      onSnapshot(q, (querySnapshot) => {
        let cash = 0;
        let card = 0;
        querySnapshot.forEach((doc) => {
          const order = doc.data();
          if (order.paymentType === 'cash') {
            cash += parseFloat(order.total);
          } else if (order.paymentType === 'card') {
            card += parseFloat(order.total);
          }
        });
        setCashSales(cash);
        setCardSales(card);
        setTotalSales(cash + card);
      });
    };

    fetchShopDetails();
    fetchDailySales();
  }, [currentUser]);

  const handlePrint = () => {
    const printContent = `
      <style>
        .bill-container {
          font-family: 'Arial', sans-serif;
          width: 80mm;
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
        .bill-summary, .bill-details {
          width: 100%;
          border-collapse: collapse;
        }
        .bill-summary th, .bill-summary td, .bill-details th, .bill-details td {
          border: 1px solid #ccc;
          padding: 5px;
          text-align: left;
        }
        .bill-footer {
          margin-top: 10px;
          text-align: center;
        }
      </style>
      <div class="bill-container">
        <div class="bill-header">
          ${shopDetails.logoUrl ? `<img src="${shopDetails.logoUrl}" alt="Logo" style="width: 50px; height: 50px;"/>` : ''}
          <h2>${shopDetails.name}</h2>
          <p>${shopDetails.address}</p>
          <p>${shopDetails.phone}</p>
          <h2>Day Close Report</h2>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        <table class="bill-details">
          <thead>
            <tr>
              <th>Payment Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cash</td>
              <td>${cashSales.toFixed(3)} OMR</td>
            </tr>
            <tr>
              <td>Card</td>
              <td>${cardSales.toFixed(3)} OMR</td>
            </tr>
          </tbody>
        </table>
        <div class="bill-summary">
          <p>Total: ${totalSales.toFixed(3)} OMR</p>
        </div>
        <div class="bill-footer">
          <p>Signature:</p>
          <p>Generated by eSale-POS</p>
        </div>
      </div>
    `;
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="day-close-container">
      <h2 className="day-close-title">Day Close</h2>
      <div className="sales-summary">
        <p>Cash Sales: {cashSales.toFixed(3)} OMR</p>
        <p>Card Sales: {cardSales.toFixed(3)} OMR</p>
        <p>Total Sales: {totalSales.toFixed(3)} OMR</p>
      </div>
      <button className="print-button" onClick={handlePrint}>Print Day Close Report</button>
    </div>
  );
}

export default DayClose;
