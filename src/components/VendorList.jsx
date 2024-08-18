import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../utility/VendorList.css';
import AddEditVendor from './AddEditVendor';
import CategoryModal from './CategoryModal';

const VendorList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    useEffect(() => {
        const fetchVendors = async () => {
            let vendorQuery;
            if (isSuperAdmin) {
                vendorQuery = collection(db, 'vendors');
            } else {
                vendorQuery = query(collection(db, 'vendors'), where('shopCode', '==', currentUser.shopCode));
            }
            const vendorSnapshot = await getDocs(vendorQuery);
            const vendorsList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort vendors by vendor name (ascending order)
            vendorsList.sort((a, b) => a.name.localeCompare(b.name));

            setVendors(vendorsList);
        };

        fetchVendors();
    }, [currentUser, isSuperAdmin]);

    const handleEditVendor = (vendor) => {
        setSelectedVendor(vendor);
        setIsModalOpen(true);
    };

    const handleSaveVendor = () => {
        // Re-fetch the vendors after saving
        setIsModalOpen(false); // Close modal after saving
        fetchVendors(); // Re-fetch vendors to update the list
    };

    return (
        <div className="vendor-list-container">
            <div className='vendor-list-header'>
                <h2>Vendor List</h2>
                <button className="add-vendor-btn" onClick={() => { setSelectedVendor(null); setIsModalOpen(true); }}>Add Vendor</button>
            </div>

            <table className="vendor-table">
                <thead>
                    <tr>
                        <th>Vendor Code</th>
                        <th>Vendor Name</th>
                        <th>Contact</th>
                        <th>Address</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {vendors.map(vendor => (
                        <tr key={vendor.id}>
                            <td>{vendor.code}</td>
                            <td>{vendor.name}</td>
                            <td>{vendor.contact}</td>
                            <td>{vendor.address}</td>
                            <td>
                                <button className="edit-btn" onClick={() => handleEditVendor(vendor)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddEditVendor vendor={selectedVendor} onSave={handleSaveVendor} onClose={() => setIsModalOpen(false)} />
                </CategoryModal>
            )}
        </div>
    );
};

export default VendorList;
