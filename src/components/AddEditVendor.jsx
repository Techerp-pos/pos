import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../utility/AddEditVendor.css';

const AddEditVendor = ({ vendor, onSave, onClose }) => {
    const { currentUser } = useAuth();
    const [vendorData, setVendorData] = useState({
        code: '',
        name: '',
        trn: '',
        contact: '',
        address: '',
        paymentMode: 'CASH',
        paymentTerms: '',
        openingAmount: '',
        nature: 'CASH',
        taxRegistered: false,
        shopCode: currentUser.shopCode, // Automatically set the shopCode from currentUser
        ...vendor
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!vendor?.id) {
            generateVendorCode(); // Generate code only when adding a new vendor
        }
    }, [vendor]);

    const generateVendorCode = async () => {
        try {
            const vendorsRef = collection(db, 'vendors');
            const q = query(vendorsRef, orderBy('code', 'asc'), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.size > 0) {
                const latestVendor = querySnapshot.docs[0].data();
                const newCode = (parseInt(latestVendor.code, 10) + 2).toString().padStart(4, '0');
                setVendorData(prevState => ({ ...prevState, code: newCode }));
            } else {
                setVendorData(prevState => ({ ...prevState, code: '0001' }));
            }
        } catch (error) {
            console.error("Error generating vendor code: ", error);
            alert("Failed to generate vendor code");
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVendorData({
            ...vendorData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Ensure the code is 4 digits
        if (vendorData.code.length !== 4) {
            setError("Vendor code must be exactly 4 digits.");
            setLoading(false);
            return;
        }

        try {
            if (vendor?.id) {
                await updateDoc(doc(db, 'vendors', vendor.id), vendorData);
            } else {
                await addDoc(collection(db, 'vendors'), vendorData);
            }
            onSave(); // Trigger the onSave callback to refresh the list or close the modal
        } catch (error) {
            console.error("Error saving vendor: ", error);
            setError("Failed to save vendor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Code:</label>
                <input
                    type="text"
                    name="code"
                    value={vendorData.code}
                    onChange={handleChange}
                    required
                    maxLength="4"
                    pattern="\d{4}"
                    title="Code must be 4 digits"
                />
            </div>
            <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={vendorData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label>
                    <input type="checkbox" name="taxRegistered" checked={vendorData.taxRegistered} onChange={handleChange} />
                    Tax Registered
                </label>
            </div>
            <div className="form-group">
                <label>TRN:</label>
                <input type="text" name="trn" value={vendorData.trn} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Contact:</label>
                <input type="text" name="contact" value={vendorData.contact} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Address:</label>
                <textarea name="address" value={vendorData.address} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Payment Mode:</label>
                <select name="paymentMode" value={vendorData.paymentMode} onChange={handleChange}>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT">Credit</option>
                </select>
            </div>
            <div className="form-group">
                <label>Payment Terms:</label>
                <select name="paymentTerms" value={vendorData.paymentTerms} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="NET 30">Net 30</option>
                    <option value="NET 60">Net 60</option>
                    {/* Add more payment terms as needed */}
                </select>
            </div>
            <div className="form-group">
                <label>Opening Amount:</label>
                <input
                    type="number"
                    name="openingAmount"
                    value={vendorData.openingAmount}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Nature:</label>
                <select name="nature" value={vendorData.nature} onChange={handleChange}>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT">Credit</option>
                </select>
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Vendor'}
                </button>
                <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
            </div>
        </form>
    );
};

export default AddEditVendor;
