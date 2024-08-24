// src/components/InventoryAdjustmentMultiple.js
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const InventoryAdjustmentMultiple = () => {
    const [adjustments, setAdjustments] = useState([{ item: '', quantity: 0, reason: '' }]);

    const handleAdjustmentChange = (index, field, value) => {
        const newAdjustments = [...adjustments];
        newAdjustments[index][field] = value;
        setAdjustments(newAdjustments);
    };

    const handleAddAdjustment = () => {
        setAdjustments([...adjustments, { item: '', quantity: 0, reason: '' }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await Promise.all(
                adjustments.map((adjustment) =>
                    addDoc(collection(db, 'inventoryAdjustments'), {
                        ...adjustment,
                        type: 'multiple',
                        timestamp: new Date(),
                    })
                )
            );
            setAdjustments([{ item: '', quantity: 0, reason: '' }]);
            alert('Inventory adjustments submitted successfully');
        } catch (error) {
            console.error('Error creating inventory adjustments: ', error);
        }
    };

    return (
        <div className="inventory-adjustment-multiple">
            <h2>Inventory Adjustment - Multiple</h2>
            <form onSubmit={handleSubmit}>
                {adjustments.map((adjustment, index) => (
                    <div key={index} className="adjustment-item">
                        <input type="text" placeholder="Item" value={adjustment.item} onChange={(e) => handleAdjustmentChange(index, 'item', e.target.value)} required />
                        <input type="number" placeholder="Quantity" value={adjustment.quantity} onChange={(e) => handleAdjustmentChange(index, 'quantity', e.target.value)} required />
                        <input type="text" placeholder="Reason" value={adjustment.reason} onChange={(e) => handleAdjustmentChange(index, 'reason', e.target.value)} required />
                    </div>
                ))}
                <button type="button" onClick={handleAddAdjustment}>Add More</button>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default InventoryAdjustmentMultiple;
