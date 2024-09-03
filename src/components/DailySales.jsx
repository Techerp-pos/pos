import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

function DailySales() {
  const { currentUser } = useAuth();
  const [cashSales, setCashSales] = useState(0);
  const [cardSales, setCardSales] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs
        .map(doc => doc.data())
        .filter(order => order.shopCode === currentUser.shopCode && order.status.toLowerCase() === 'completed');

      const today = new Date().toISOString().split('T')[0];

      let cashTotal = 0;
      let cardTotal = 0;
      let overallTotal = 0;
      const filteredOrders = orders.filter(order => order.orderDate === today);

      filteredOrders.forEach((data) => {
        const totalAmount = parseFloat(data.total) || 0;
        if (data.paymentMethod.toLowerCase() === 'cash') {
          cashTotal += totalAmount;
        } else if (data.paymentMethod.toLowerCase() === 'card') {
          cardTotal += totalAmount;
        }
        overallTotal += totalAmount;
      });

      setCashSales(cashTotal);
      setCardSales(cardTotal);
      setTotalSales(overallTotal);
    };

    fetchOrders();
  }, [currentUser]);

  const fetchMonthlyData = async () => {
    if (!currentUser || !startDate || !endDate) return;

    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs
      .map(doc => doc.data())
      .filter(order =>
        order.shopCode === currentUser.shopCode &&
        order.status.toLowerCase() === 'completed' &&
        new Date(order.orderDate) >= new Date(startDate) &&
        new Date(order.orderDate) <= new Date(endDate)
      );

    setMonthlyData(orders);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Monthly Sales Report', 20, 20);
    doc.autoTable({
      head: [['Order ID', 'Date', 'Total', 'Status', 'Items', 'Discount']],
      body: monthlyData.map(order => [
        order.orderNumber,
        order.orderDate,
        parseFloat(order.total).toFixed(3),
        order.status,
        order.items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', '),
        parseFloat(order.discount || '0').toFixed(3)
      ])
    });
    doc.save('report.pdf');
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      monthlyData.map(order => ({
        'Order ID': order.orderNumber,
        Date: order.orderDate,
        Total: parseFloat(order.total).toFixed(3),
        Status: order.status,
        Items: order.items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', '),
        Discount: parseFloat(order.discount || '0').toFixed(3)
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, 'report.xlsx');
  };

  return (
    <div className="daily-sales-container">
      <h2>Daily Sales</h2>
      <div className="sales-details">
        <p>Cash Sales: {cashSales.toFixed(3)} OMR</p>
        <p>Card Sales: {cardSales.toFixed(3)} OMR</p>
        <p>Total Sales: {totalSales.toFixed(3)} OMR</p>
      </div>
      <div className="report-section">
        <h2>Generate Report</h2>
        <div>
          <label>
            Start Date:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            End Date:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>
        <button onClick={fetchMonthlyData}>Fetch Data</button>
        <button onClick={generatePDF}>Download PDF</button>
        <button onClick={generateExcel}>Download Excel</button>
      </div>
    </div>
  );
}

export default DailySales;
