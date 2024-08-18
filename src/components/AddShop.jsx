// AddShop.js
import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function AddShop() {
    const [shopName, setShopName] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [shopPhone, setShopPhone] = useState('');
    const { currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const shopCode = generateShopCode(shopName); // Implement this function to generate a unique code for the shop

        try {
            await addDoc(collection(db, 'shops'), {
                name: shopName,
                address: shopAddress,
                phone: shopPhone,
                shopCode: shopCode,
                createdBy: currentUser.uid,
                createdAt: new Date(),
            });
            alert('Shop created successfully');
        } catch (error) {
            console.error('Error creating shop:', error);
            alert('Failed to create shop');
        }
    };

    const generateShopCode = (name) => {
        return Math.floor(100 + Math.random() * 900);
    };

    return (
        <div className="add-shop">
            <h2>Add New Shop</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Shop Name:</label>
                    <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Shop Address:</label>
                    <textarea
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Shop Phone:</label>
                    <input
                        type="text"
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Add Shop</button>
            </form>
        </div>
    );
}

export default AddShop;
