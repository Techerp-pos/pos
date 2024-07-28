// src/components/ProductList.js
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductModal from './ProductModal';
import AddEditProduct from './AddEditProduct';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            const productCollection = collection(db, 'products');
            const productSnapshot = await getDocs(productCollection);
            setProducts(productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchProducts();
    }, []);

    return (
        <div className="product-list">
            <div className='product-list-button'>
                <h2>Product List</h2>
                <button className="success-btn" onClick={() => setIsModalOpen(true)}>Add Product</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>{product.price}</td>
                            <td>{product.stock}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isModalOpen && (
                <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <AddEditProduct onClose={() => setIsModalOpen(false)} />
                </ProductModal>
            )}
        </div>
    );
};

export default ProductList;
