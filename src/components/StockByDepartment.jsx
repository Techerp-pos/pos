import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register required Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

function StockByDepartment() {
  const [stock, setStock] = useState([]);

  useEffect(() => {
    const fetchStock = async () => {
      const stockCollection = collection(db, 'stock');
      const stockSnapshot = await getDocs(stockCollection);
      setStock(stockSnapshot.docs.map(doc => doc.data()));
    };

    fetchStock();
  }, []);

  const data = {
    labels: stock.map(item => item.department),
    datasets: [
      {
        label: 'Stock by Department',
        data: stock.map(item => item.quantity),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  return (
    <div>
      <h2>Stock by Department</h2>
      <Pie data={data} />
    </div>
  );
}

export default StockByDepartment;
    