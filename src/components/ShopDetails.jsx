import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function ShopDetails() {
    const [shopDetails, setShopDetails] = useState(null);
    const [shopId, setShopId] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (currentUser) {
                try {
                    // Get the user document to find the shopId
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userDoc = userDocSnap.data();
                        const shopId = userDoc.shopId;
                        setShopId(shopId);

                        // Get the shop details using the shopId
                        const shopDocRef = doc(db, 'shopDetails', shopId);
                        const shopDocSnap = await getDoc(shopDocRef);

                        if (shopDocSnap.exists()) {
                            setShopDetails(shopDocSnap.data());
                        } else {
                            console.log('No shop document found!');
                        }
                    } else {
                        console.log('No user document found!');
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
                    {shopDetails.logoUrl && <img src={shopDetails.logoUrl} className="shop-logo" alt="Shop Logo" style={{ maxWidth: '350px' }} />}
                    <p>Name: <span className="shop-name">{shopDetails.name}</span></p>
                    <p>Address: <span className="shop-address">{shopDetails.address}</span></p>
                    <button className="edit-btn"><Link to={'/settings'}>Edit</Link></button>
                    {/* <div>
                        <Link to={`/inventory/${shopId}`}>Manage Inventory</Link>
                    </div>
                    <div>
                        <Link to={`/accounts/${shopId}`}>Manage Accounts</Link>
                    </div> */}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default ShopDetails;
