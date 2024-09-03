import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function ShopDetails() {
    const [shopDetails, setShopDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (currentUser) {
                try {
                    console.log(`Fetching shop details for user: ${currentUser.uid}`);

                    // Fetch the user's document to get the shopCode
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userDoc = userDocSnap.data();
                        const shopCode = userDoc.shopCode;
                        console.log('Retrieved shopCode:', shopCode);

                        if (shopCode) {
                            // Query the 'shops' collection to find the shop details by shopCode
                            const shopQuery = query(collection(db, 'shops'), where('shopCode', '==', shopCode));
                            console.log('Executing shop query:', shopQuery);

                            const shopQuerySnapshot = await getDocs(shopQuery);

                            if (!shopQuerySnapshot.empty) {
                                console.log('Shop query snapshot:', shopQuerySnapshot.docs.map(doc => doc.data()));

                                // Assuming shopCode is unique, there should be only one document
                                const shopDetailsData = shopQuerySnapshot.docs[0].data();
                                setShopDetails(shopDetailsData);
                            } else {
                                console.log('No shop found with the given shopCode!');
                            }
                        } else {
                            console.log('shopCode not found in the user document!');
                        }
                    } else {
                        console.log('No user document found!');
                    }
                } catch (error) {
                    console.error('Error fetching shop details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchShopDetails();
    }, [currentUser]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!shopDetails) {
        return <p>No shop details found.</p>;
    }

    return (
        <div className="shop-details-container">
            <h2>Shop Details</h2>
            <div className="shop-details-content">
                {shopDetails.logoUrl && (
                    <img src={shopDetails.logoUrl} className="shop-logo" alt="Shop Logo" style={{ maxWidth: '350px' }} />
                )}
                <p>Name: <span className="shop-name">{shopDetails.name}</span></p>
                <p>Address: <span className="shop-address">{shopDetails.address}</span></p>
                <p>Phone: <span className="shop-phone">{shopDetails.phone}</span></p>
                <p>Shop Code: <span className="shop-code">{shopDetails.shopCode}</span></p>
                <p>Created By: <span className="created-by">{shopDetails.createdBy}</span></p>
                <p>Created At: <span className="created-at">{new Date(shopDetails.createdAt.seconds * 1000).toLocaleDateString()}</span></p>
                <button className="edit-btn"><Link to={'/settings'}>Edit</Link></button>
            </div>
        </div>
    );
}

export default ShopDetails;
