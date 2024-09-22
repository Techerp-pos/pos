import React, { useState, useEffect, useContext } from 'react';
import { db, storage } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';
import { QZTrayContext } from '../contexts/QzTrayContext';

function Settings() {
  const { currentUser } = useAuth();
  const { isConnected, availablePrinters } = useContext(QZTrayContext);
  const [shopDetails, setShopDetails] = useState({
    name: '',
    address: '',
    phone: '',
    logoUrl: '',
    shopCode: '',
    defaultPrinter: '',
  });
  const [logo, setLogo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchShopDetails = async () => {
      if (currentUser) {
        const shopDocRef = doc(db, 'shopDetails', currentUser.uid);
        const shopDoc = await getDoc(shopDocRef);
        if (shopDoc.exists()) {
          const data = shopDoc.data();
          setShopDetails(data);
        } else {
          // Initialize shopDetails document if it doesn't exist
          await setDoc(shopDocRef, shopDetails);
        }
      }
    };

    fetchShopDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShopDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handlePrinterChange = (selectedOption) => {
    const printer = selectedOption ? selectedOption.value : '';
    setShopDetails((prevDetails) => ({ ...prevDetails, defaultPrinter: printer }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let updatedDetails = { ...shopDetails };

      if (logo) {
        const logoRef = ref(storage, `logos/${currentUser.uid}/${logo.name}`);
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
            updatedDetails.logoUrl = logoUrl;
            setShopDetails((prevDetails) => ({ ...prevDetails, logoUrl }));
            await saveShopDetails(updatedDetails);
          }
        );
      } else {
        await saveShopDetails(updatedDetails);
      }
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Failed to update shop details');
      setIsUploading(false);
    }
  };

  const saveShopDetails = async (details) => {
    try {
      if (currentUser) {
        const shopDocRef = doc(db, 'shopDetails', currentUser.uid);
        await setDoc(shopDocRef, details, { merge: true });
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
        {/* Shop Name */}
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

        {/* Address */}
        <div className="form-group">
          <label>Address</label>
          <textarea
            name="address"
            value={shopDetails.address}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        {/* Phone */}
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

        {/* Shop Code */}
        <div className="form-group">
          <label>Shop Code</label>
          <input
            type="text"
            name="shopCode"
            value={shopDetails.shopCode}
            onChange={handleChange}
            required
          />
        </div>

        {/* Default Printer Selection */}
        <div className="form-group">
          <label>Default Printer</label>
          <Select
            options={availablePrinters.map((printer) => ({
              value: printer,
              label: printer,
            }))}
            value={
              shopDetails.defaultPrinter
                ? { value: shopDetails.defaultPrinter, label: shopDetails.defaultPrinter }
                : null
            }
            onChange={handlePrinterChange}
            placeholder="Select a printer"
            isDisabled={!isConnected || availablePrinters.length === 0}
          />
          {!isConnected && (
            <p style={{ color: 'red' }}>QZ Tray is not connected. Please ensure it is running.</p>
          )}
          {isConnected && availablePrinters.length === 0 && (
            <p style={{ color: 'red' }}>No printers detected. Please connect a printer.</p>
          )}
        </div>

        {/* Logo Upload */}
        <div className="form-group">
          <label>Logo</label>
          <input type="file" onChange={handleLogoChange} accept="image/*" />
          {shopDetails.logoUrl && (
            <img src={shopDetails.logoUrl} alt="Logo" className="shop-logo" />
          )}
          {isUploading && <p>Uploading: {uploadProgress.toFixed(2)}%</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default Settings;
  