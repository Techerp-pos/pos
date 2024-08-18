// src/components/CustomerList.js
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../utility/VendorList.css';
import AddEditCustomer from './AddEditCustomer';
import CategoryModal from './CategoryModal';
import '../utility/CustomerList.css'

const CustomerList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            let customerQuery;
            if (isSuperAdmin) {
                customerQuery = collection(db, 'customers');
            } else {
                customerQuery = query(collection(db, 'customers'), where('shopCode', '==', currentUser.shopCode));
            }
            const customerSnapshot = await getDocs(customerQuery);
            setCustomers(customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchCustomers();
    }, [currentUser, isSuperAdmin]);

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="customer-list-container">
            <div className='customer-list-header'>
                <h2>Customer List</h2>
                <button className="add-customer-btn" onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}>Add Customer</button>
            </div>

            <table className="customer-table">
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Micr</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(customer => (
                        <tr key={customer.id}>
                            <td>{customer.id}</td>
                            <td>{customer.name}</td>
                            <td>{customer.micr}</td>
                            <td>{customer.phone}</td>
                            <td>
                                <button className="edit-btn" onClick={() => handleEditCustomer(customer)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <CategoryModal isOpen={isModalOpen}  onClose={() => setIsModalOpen(false)}>
                    <AddEditCustomer customer={selectedCustomer} onSave={handleSaveCustomer} onClose={() => setIsModalOpen(false)} />
                </CategoryModal>
            )}
        </div>
    );
};

export default CustomerList;
