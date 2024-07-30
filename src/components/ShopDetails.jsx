import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an AuthContext to provide current user information
import { Link } from 'react-router-dom';

function ShopDetails() {
    const [shopDetails, setShopDetails] = useState({});
    const { currentUser } = useAuth(); // Use context to get the current user

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, 'shopDetails', currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setShopDetails(docSnap.data());
                    } else {
                        console.log('No such document!');
                    }
                } catch (error) {
                    console.error('Error fetching shop details:', error);
                }
            }
        };

        fetchShopDetails();
    }, [currentUser]);

    return (
        <div className="shop-details-container">
            <h2>Shop Details</h2>
            {shopDetails ? (
                <div className="shop-details-content">
                    <img src={shopDetails.logoUrl} className="shop-logo" alt="Shop Logo" style={{ maxWidth: '350px'}}/>
                    <p>Name: <span className="shop-name">{shopDetails.name}</span></p>
                    <p>Address: <span className="shop-address">{shopDetails.address}</span></p>
                    <button className="edit-btn"><Link to={'/settings'}>Edit</Link></button>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default ShopDetails;
