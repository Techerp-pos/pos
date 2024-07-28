import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { currentUser } = useAuth();
  const [shopDetails, setShopDetails] = useState({
    name: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    const fetchShopDetails = async () => {
      if (currentUser) {
        const shopDoc = await getDoc(doc(db, 'shopDetails', currentUser.uid));
        if (shopDoc.exists()) {
          setShopDetails(shopDoc.data());
        }
      }
    };

    fetchShopDetails();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShopDetails({ ...shopDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        await setDoc(doc(db, 'shopDetails', currentUser.uid), shopDetails);
        alert('Shop details updated successfully');
      }
    } catch (error) {
      console.error('Error updating shop details: ', error);
      alert('Failed to update shop details');
    }
  };

  return (
    <div>
      <h2>Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Shop Name</label>
          <input
            type="text"
            name="name"
            value={shopDetails.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={shopDetails.address}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            name="phone"
            value={shopDetails.phone}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-btn">Save</button>
      </form>
    </div>
  );
}

export default Settings;
