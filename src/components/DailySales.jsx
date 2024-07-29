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
        .filter(order => order.addedBy === currentUser.uid && order.status === 'Completed');

      const today = new Date().toISOString().split('T')[0];

      let cashTotal = 0;
      let cardTotal = 0;
      let overallTotal = 0;
      const filteredOrders = orders.filter(order => order.orderDate === today);

      filteredOrders.forEach((data) => {
        if (data.paymentType === 'cash') {
          cashTotal += parseFloat(data.total);
        } else if (data.paymentType === 'card') {
          cardTotal += parseFloat(data.total);
        }
        overallTotal += parseFloat(data.total);
      });

      setCashSales(cashTotal);
      setCardSales(cardTotal);
      setTotalSales(overallTotal);
    };

    fetchOrders();
  }, [currentUser]);

  const fetchMonthlyData = async () => {
    if (!currentUser) return;

    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs
      .map(doc => doc.data())
      .filter(order => order.addedBy === currentUser.uid && order.status === 'Completed');

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return orderDate >= start && orderDate <= end;
    });

    setMonthlyData(filteredOrders);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Monthly Sales Report', 20, 20);
    doc.autoTable({
      head: [['Order ID', 'Date', 'Total', 'Status', 'Items', 'Discount']],
      body: monthlyData.map(order => [
        order.orderId,
        order.orderDate,
        order.total,
        order.status,
        order.cart.map(item => `${item.name} (Qty: ${item.quantity})`).join(', '),
        order.discount
      ])
    });
    doc.save('report.pdf');
  };

  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      monthlyData.map(order => ({
        'Order ID': order.orderId,
        Date: order.orderDate,
        Total: order.total,
        Status: order.status,
        Items: order.cart.map(item => `${item.name} (Qty: ${item.quantity})`).join(', '),
        Discount: order.discount
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
