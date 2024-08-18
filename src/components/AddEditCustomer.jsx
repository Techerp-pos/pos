import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../utility/AddEditVendor.css';

const AddEditCustomer = ({ customer, onSave, onClose }) => {
    const { currentUser } = useAuth();
    const [customerData, setCustomerData] = useState({
        id: '',
        name: '',
        address: '',
        mobile: '',
        email: '',
        trn: '',
        micr: '',
        pricingLevel: '',
        group: 'DEFAULT',
        creditAmountLimit: 0,
        creditDayLimit: 0,
        openingAmount: 0,
        openingNature: '',
        taxRegistered: false,
        arCustomer: false,
        shopCode: currentUser.shopCode,  // Automatically set the shopCode from currentUser
        addedBy: currentUser.uid,
        ...customer
    });

    useEffect(() => {
        if (!customer?.id) {
            generateCustomerId(); // Generate ID only when adding a new customer
        }
    }, [customer]);

    const generateCustomerId = async () => {
        try {
            const customersRef = collection(db, 'customers');
            const q = query(customersRef, orderBy('id', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.size > 0) {
                const latestCustomer = querySnapshot.docs[0].data();
                const newId = (parseInt(latestCustomer.id, 10) + 1).toString().padStart(4, '0');
                setCustomerData(prevState => ({ ...prevState, id: newId, micr: newId }));
            } else {
                setCustomerData(prevState => ({ ...prevState, id: '0001', micr: '0001' }));
            }
        } catch (error) {
            console.error("Error generating customer ID: ", error);
            alert("Failed to generate customer ID");
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCustomerData({
            ...customerData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (customer?.id) {
                await updateDoc(doc(db, 'customers', customer.id), customerData);
            } else {
                await addDoc(collection(db, 'customers'), customerData);
            }
            onSave();
        } catch (error) {
            console.error("Error saving customer: ", error);
            alert("Failed to save customer");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'block' }}>
            <div className="form-group dual-input">
                <label>Id:</label>
                <input
                    type="text"
                    name="id"
                    value={customerData.id}
                    onChange={handleChange}
                    required
                    readOnly
                />
                <label>Micr:</label>
                <input
                    type="text"
                    name="micr"
                    value={customerData.micr}
                    onChange={handleChange}
                    required
                    readOnly
                    disabled
                />
            </div>
            <div className="form-group dual-input">
                <label>Name:</label>
                <input type="text" name="name" value={customerData.name} onChange={handleChange} required />
                <label>Mobile:</label>
                <input type="text" name="mobile" value={customerData.mobile} onChange={handleChange} />
            </div>
            <div className="form-group dual-input">
                <label>Address:</label>
                <input type="text" name="address" value={customerData.address} onChange={handleChange} />
                <label>Email:</label>
                <input type="email" name="email" value={customerData.email} onChange={handleChange} />
            </div>
            <label>
                <input
                    type="checkbox"
                    name="taxRegistered"
                    checked={customerData.taxRegistered}
                    onChange={handleChange}
                />
                Tax Registered
            </label>
            <div className="form-group dual-input">
                <label>TRN:</label>
                <input
                    type="text"
                    name="trn"
                    value={customerData.trn}
                    onChange={handleChange}
                    disabled={!customerData.taxRegistered}
                />
                <label>Pricing Level:</label>
                <input type="text" name="pricingLevel" value={customerData.pricingLevel} onChange={handleChange} />
            </div>
            <div className="form-group dual-input">
                <label>Group:</label>
                <select name="group" value={customerData.group} onChange={handleChange}>
                    <option value="DEFAULT">Default</option>
                    {/* <option value="VIP">VIP</option> */}
                    {/* Add more groups as needed */}
                </select>
                <label>
                    <input
                        type="checkbox"
                        name="arCustomer"
                        checked={customerData.arCustomer}
                        onChange={handleChange}
                    />
                    A/R Customer
                </label>
            </div>
            <div className="form-group dual-input">
                <label>Credit Amount Limit:</label>
                <input
                    type="number"
                    name="creditAmountLimit"
                    value={customerData.creditAmountLimit}
                    onChange={handleChange}
                    disabled={!customerData.arCustomer}
                />
                <label>Credit Day Limit:</label>
                <input
                    type="number"
                    name="creditDayLimit"
                    value={customerData.creditDayLimit}
                    onChange={handleChange}
                    disabled={!customerData.arCustomer}
                />
            </div>
            <div className="form-group dual-input">
                <label>Opening Amount:</label>
                <input
                    type="number"
                    name="openingAmount"
                    value={customerData.openingAmount}
                    onChange={handleChange}
                    disabled={!customerData.arCustomer}
                />
                <label>Opening Nature:</label>
                <select
                    name="openingNature"
                    value={customerData.openingNature}
                    onChange={handleChange}
                    disabled={!customerData.arCustomer}
                >
                    <option value="" disabled>Select...</option>
                    <option value="CREDIT">Credit</option>
                    <option value="DEBIT">Debit</option>
                </select>
            </div>
            <div className="form-actions">
                <button type="submit">Save Customer</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </div>
        </form>
    );
};

export default AddEditCustomer;
