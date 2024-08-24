import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth } from '../config/firebase'; // Assuming you have Firebase auth configured
import CategoryModal from './CategoryModal';
import '../utility/CategoryList.css'; // Create a CSS file for category list styling
import AddCategory from './AddCategory';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [shopCode, setShopCode] = useState(null);

    useEffect(() => {
        const fetchUserShopCode = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = doc(db, 'users', user.uid); // Adjust the path to match where user data is stored
                const userSnapshot = await getDoc(userDoc);
                if (userSnapshot.exists()) {
                    setShopCode(userSnapshot.data().shopCode);
                }
            }
        };

        fetchUserShopCode();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            if (shopCode) {
                const categoryCollection = collection(db, 'categories');
                const categoryQuery = query(categoryCollection, where('shopCode', '==', shopCode));
                const categorySnapshot = await getDocs(categoryQuery);
                setCategories(categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        };

        fetchCategories();
    }, [shopCode]);

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    return (
        <div className="category-list-container">
            <div className='category-list-header'>
                <h2>Category List</h2>
                <button className="add-category-btn" onClick={() => { setSelectedCategory(null); setIsModalOpen(true); }}>Add Category</button>
            </div>
            <table className="category-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(category => (
                        <tr key={category.id}>
                            <td>{category.name}</td>
                            <td>{category.description}</td>
                            <td>
                                <button className="edit-btn" onClick={() => handleEditCategory(category)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddCategory category={selectedCategory} onClose={() => setIsModalOpen(false)} />
                </CategoryModal>
            )}
        </div>
    );
};

export default CategoryList;
