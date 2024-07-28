import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function DailySales() {
  const { currentUser } = useAuth();
  const [cashSales, setCashSales] = useState(0);
  const [cardSales, setCardSales] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'orders'),
      where('orderDate', '==', today),
      where('status', '==', 'Completed'),
      where('addedBy', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let cashTotal = 0;
      let cardTotal = 0;
      let overallTotal = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(data); // Log the data to verify the fetched data structure
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
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div>
      <h2>Daily Sales</h2>
      <p>Cash Sales: {cashSales.toFixed(3)} OMR</p>
      <p>Card Sales: {cardSales.toFixed(3)} OMR</p>
      <p>Total Sales: {totalSales.toFixed(3)} OMR</p>
    </div>
  );
}

export default DailySales;
