// src/components/ProductList.js
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ProductModal from './ProductModal';
import AddEditProduct from './AddEditProduct';
import { useAuth } from '../contexts/AuthContext';

const ProductList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            let productQuery;
            if (isSuperAdmin) {
                productQuery = collection(db, 'products');
            } else {
                productQuery = query(collection(db, 'products'), where('addedBy', '==', currentUser.uid));
            }
            const productSnapshot = await getDocs(productQuery);
            setProducts(productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchProducts();
    }, [currentUser, isSuperAdmin]);

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="product-list">
            <div className='product-list-button'>
                <h2>Product List</h2>
                <button className="success-btn" onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}>Add Product</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>{product.price}</td>
                            <td>{product.stock}</td>
                            <td>
                                <button onClick={() => handleEditProduct(product)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddEditProduct product={selectedProduct} onClose={() => setIsModalOpen(false)} />
                </ProductModal>
            )}
        </div>
    );
};

export default ProductList;
