import React, { useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { currentUser } = useAuth();
  const [shopDetails, setShopDetails] = useState({
    name: '',
    address: '',
    phone: '',
    logoUrl: '',
  });
  const [logo, setLogo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    if (logo) {
      const logoRef = ref(storage, `logos/${currentUser.uid}`);
      const uploadTask = uploadBytesResumable(logoRef, logo);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading logo: ', error);
          alert('Failed to upload logo');
          setIsUploading(false);
        },
        async () => {
          const logoUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setShopDetails((prevDetails) => ({ ...prevDetails, logoUrl }));
          saveShopDetails({ ...shopDetails, logoUrl });
        }
      );
    } else {
      saveShopDetails(shopDetails);
    }
  };

  const saveShopDetails = async (details) => {
    try {
      if (currentUser) {
        await setDoc(doc(db, 'shopDetails', currentUser.uid), details);
        alert('Shop details updated successfully');
      }
    } catch (error) {
      console.error('Error updating shop details: ', error);
      alert('Failed to update shop details');
    }
    setIsUploading(false);
  };

  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>
      <form className="settings-form" onSubmit={handleSubmit}>
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
        <div className="form-group">
          <label>Logo</label>
          <input
            type="file"
            onChange={handleLogoChange}
            accept="image/*"
          />
          {shopDetails.logoUrl && <img src={shopDetails.logoUrl} alt="Logo" className="shop-logo" />}
          {isUploading && <p>Uploading: {uploadProgress.toFixed(2)}%</p>}
        </div>
        <button type="submit" className="submit-btn" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default Settings;