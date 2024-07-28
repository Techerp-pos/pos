import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an AuthContext to provide current user information

function ShopDetails() {
    const [shopDetails, setShopDetails] = useState({});
    const { currentUser } = useAuth(); // Use context to get the current user

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, 'users', currentUser.uid);
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
        <div>
            <h2>Shop Details</h2>
            {shopDetails ? (
                <>
                    <p>Name: {shopDetails.name}</p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default ShopDetails;
