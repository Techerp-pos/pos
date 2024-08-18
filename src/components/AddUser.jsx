// AddUser.js
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function AddUser() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedShop, setSelectedShop] = useState('');
    const [shops, setShops] = useState([]);
    const [role, setRole] = useState('user');
    const { signup } = useAuth();

    useEffect(() => {
        const fetchShops = async () => {
            const shopsCollection = collection(db, 'shops');
            const shopSnapshot = await getDocs(shopsCollection);
            setShops(shopSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchShops();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await signup(email, password, selectedShop);
            alert('User created successfully');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user');
        }
    };

    return (
        <div className="add-user">
            <h2>Add New User</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Shop:</label>
                    <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} required>
                        <option value="" disabled>Select a Shop</option>
                        {shops.map(shop => (
                            <option key={shop.id} value={shop.shopCode}>{shop.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Role:</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} required>
                        <option value="user">User</option>
                        <option value="ShopAdmin">Shop Admin</option>
                        {/* Add more roles as needed */}
                    </select>
                </div>
                <button type="submit">Add User</button>
            </form>
        </div>
    );
}

export default AddUser;
