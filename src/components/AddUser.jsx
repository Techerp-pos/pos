// src/components/AddUser.js
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function AddUser() {
    const { signup } = useAuth();
    const [shops, setShops] = useState([]);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', shopId: '', employeeType: '' });

    useEffect(() => {
        const fetchShops = async () => {
            const shopsCollection = collection(db, 'shopDetails');
            const shopsSnapshot = await getDocs(shopsCollection);
            setShops(shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchShops();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signup(newUser.email, newUser.password);
            await addDoc(collection(db, 'users'), {
                uid: userCredential.user.uid,
                email: newUser.email,
                role: newUser.role,
                shopId: newUser.shopId,
                employeeType: newUser.employeeType
            });
            setNewUser({ email: '', password: '', role: 'user', shopId: '', employeeType: '' });
            alert('User added successfully');
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Failed to add user');
        }
    };

    return (
        <div className="add-user-container">
            <h2>Add User</h2>
            <form onSubmit={handleAddUser}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <select name="role" value={newUser.role} onChange={handleInputChange}>
                        <option value="user">User</option>
                        <option value="superAdmin">Super Admin</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Shop</label>
                    <select name="shopId" value={newUser.shopId} onChange={handleInputChange}>
                        <option value="">Select Shop</option>
                        {shops.map(shop => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                        ))}
                    </select>
                </div>
                {newUser.role === 'user' && (
                    <div className="form-group">
                        <label>Employee Type</label>
                        <select name="employeeType" value={newUser.employeeType} onChange={handleInputChange}>
                            <option value="">Select Employee Type</option>
                            <option value="manager">Manager</option>
                            <option value="accounts">Accounts</option>
                            <option value="waiter">Waiter</option>
                        </select>
                    </div>
                )}
                <button type="submit" className="submit-btn">Add User</button>
            </form>
        </div>
    );
}

export default AddUser;
