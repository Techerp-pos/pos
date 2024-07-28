import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function ProductList() {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            const productCollection = collection(db, 'products');
            const productSnapshot = await getDocs(productCollection);
            const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productList);
        };

        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, 'products', id));
        setProducts(products.filter(product => product.id !== id));
    };

    return (
        <div className="ProductList">
            <div className="header">
                <h2>Product List</h2>
                <button className="add-button" onClick={() => navigate('/add-product')}>Add Product</button>
            </div>
            <table>
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
                                <button className="edit-button" onClick={() => navigate(`/edit-product/${product.id}`)}>Edit</button>
                                <button className="delete-button" onClick={() => handleDelete(product.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProductList;
