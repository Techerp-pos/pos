import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

function AddProduct() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('basic');
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [productStock, setProductStock] = useState('');
    const [productImage, setProductImage] = useState(null);
    const [barcode, setBarcode] = useState('');
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [localName, setLocalName] = useState('');
    const [shortName, setShortName] = useState('');
    const [unitType, setUnitType] = useState('PCS'); // Default unit type
    const [loading, setLoading] = useState(false);
    const barcodeInputRef = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            const categoriesCollection = collection(db, 'categories');
            const categoriesSnapshot = await getDocs(categoriesCollection);
            setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        const fetchVendors = async () => {
            const vendorsCollection = collection(db, 'vendors');
            const vendorsSnapshot = await getDocs(vendorsCollection);
            setVendors(vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchCategories();
        fetchVendors();

        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setProductImage(e.target.files[0]);
        }
    };

    const generateBarcode = async () => {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('barcode', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.size > 0) {
            const latestProduct = querySnapshot.docs[0].data();
            return (parseInt(latestProduct.barcode) + 1).toString().padStart(13, '0');
        } else {
            return '1300000000001';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = '';
        let finalBarcode = barcode;

        try {
            if (!finalBarcode) {
                finalBarcode = await generateBarcode();
            }

            if (productImage) {
                const imageRef = ref(storage, `product_images/${productImage.name}`);
                const snapshot = await uploadBytes(imageRef, productImage);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'products'), {
                name: productName,
                price: parseFloat(productPrice),
                category: productCategory,
                stock: parseInt(productStock, 10),
                imageUrl: imageUrl,
                barcode: finalBarcode,
                vendor: selectedVendor,
                localName: localName,
                shortName: shortName,
                unitType: unitType,
                shopCode: currentUser.shopCode,
                addedBy: currentUser.uid,
                createdAt: new Date(),
            });

            // Reset form fields
            setProductName('');
            setProductPrice('');
            setProductCategory('');
            setProductStock('');
            setProductImage(null);
            setBarcode('');
            setSelectedVendor('');
            setLocalName('');
            setShortName('');
            setUnitType('PCS');
            alert('Product added successfully');
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-product-modal">
            <div className="modal-header">
                <h2>Add New Product</h2>
                <button className="close-btn" onClick={() => window.history.back()}>X</button>
            </div>
            <div className="modal-tabs">
                <button
                    className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    Basic Details
                </button>
                <button
                    className={`tab-btn ${activeTab === 'more' ? 'active' : ''}`}
                    onClick={() => setActiveTab('more')}
                >
                    More Details
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                {activeTab === 'basic' && (
                    <div className="basic-details">
                        <div>
                            <label>Product Name:</label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label>Price:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={productPrice}
                                onChange={(e) => setProductPrice(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label>Category:</label>
                            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} required>
                                <option value="" disabled>Select a Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.name}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Vendor:</label>
                            <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} required>
                                <option value="" disabled>Select a Vendor</option>
                                {vendors.map(vendor => (
                                    <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Unit Type:</label>
                            <select value={unitType} onChange={(e) => setUnitType(e.target.value)} required>
                                <option value="PCS">PCS</option>
                                <option value="Each">Each</option>
                                <option value="Carton">Carton</option>
                                <option value="Pack">Pack</option>
                                <option value="Box">Box</option>
                                <option value="KG">KG</option>
                            </select>
                        </div>
                        <div>
                            <label>Stock Quantity:</label>
                            <input
                                type="number"
                                value={productStock}
                                onChange={(e) => setProductStock(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'more' && (
                    <div className="more-details">
                        <div>
                            <label>Local Name:</label>
                            <input
                                type="text"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Short Name:</label>
                            <input
                                type="text"
                                value={shortName}
                                onChange={(e) => setShortName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Barcode (Scan or Type Manually):</label>
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Scan or enter manually"
                                ref={barcodeInputRef}
                            />
                        </div>
                        <div>
                            <label>Product Image:</label>
                            <input
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </div>
                    </div>
                )}
                <div className="modal-footer">
                    <button type="button" className="delete-btn">Delete</button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Adding...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddProduct;
