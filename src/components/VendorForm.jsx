import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const VendorForm = ({ vendor, onSave, onClose }) => {
    const [vendorData, setVendorData] = useState({
        code: '',
        name: '',
        trn: '',
        contact: '',
        address: '',
        paymentMode: 'CASH',
        taxRegistered: false,
        ...vendor
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVendorData({
            ...vendorData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (vendor?.id) {
            await updateDoc(doc(db, 'vendors', vendor.id), vendorData);
        } else {
            await addDoc(collection(db, 'vendors'), vendorData);
        }
        onSave();
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Code:
                <input type="text" name="code" value={vendorData.code} onChange={handleChange} required />
            </label>
            <label>
                Name:
                <input type="text" name="name" value={vendorData.name} onChange={handleChange} required />
            </label>
            <label>
                TRN:
                <input type="text" name="trn" value={vendorData.trn} onChange={handleChange} />
            </label>
            <label>
                Contact:
                <input type="text" name="contact" value={vendorData.contact} onChange={handleChange} />
            </label>
            <label>
                Address:
                <textarea name="address" value={vendorData.address} onChange={handleChange} />
            </label>
            <label>
                Payment Mode:
                <select name="paymentMode" value={vendorData.paymentMode} onChange={handleChange}>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT">Credit</option>
                </select>
            </label>
            <label>
                Tax Registered:
                <input type="checkbox" name="taxRegistered" checked={vendorData.taxRegistered} onChange={handleChange} />
            </label>
            <button type="submit">Save Vendor</button>
            <button type="button" onClick={onClose}>Cancel</button>
        </form>
    );
};

export default VendorForm;
