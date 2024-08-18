import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ProductModal from './ProductModal';
import AddEditProduct from './AddEditProduct';
import { useAuth } from '../contexts/AuthContext';
import '../utility/ProductList.css';

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
        <div className="product-list-container">
            <div className='product-list-header' style={{display: 'flex', alignItems: 'space-between', width: '100%'}}>
                <h2>Product List</h2>
                <button className="add-product-btn" onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}><img width="24" height="24" src="https://img.icons8.com/parakeet-line/48/add.png" alt="add"/></button>
            </div>

            <table className="product-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Vendor</th>
                        <th>Price</th>
                        <th>Barcode</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>{product.code}</td>
                            <td>{product.name}</td>
                            <td>{product.department}</td>
                            <td>{product.vendor}</td>
                            <td>{product.price}</td>
                            <td>{product.barcode}</td>
                            <td>
                                <button className="edit-btn" onClick={() => handleEditProduct(product)}>Edit</button>
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
