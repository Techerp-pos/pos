import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import '../utility/AddEditProduct.css';

const GoodsReceiveNote = () => {
    const { currentUser } = useAuth();
    const [grnItems, setGrnItems] = useState([{ item: '', uom: '', receivedQty: 0, foc: 0, fQty: 0, receivedCost: 0, discount: 0, netCost: 0, tax: 0, taxType: '', taxAmount: 0, costWithoutTax: 0, finalCost: 0 }]);
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [vendorSuggestions, setVendorSuggestions] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [activeInputIndex, setActiveInputIndex] = useState(null);
    const [activeVendor, setActiveVendor] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Load all products when the page mounts
    useEffect(() => {
        const fetchProducts = async () => {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('shopCode', '==', currentUser.shopCode));
            const querySnapshot = await getDocs(q);
            const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllProducts(products);
        };

        fetchProducts();
    }, [currentUser.shopCode]);

    // Filter products based on the search input
    useEffect(() => {
        if (grnItems[activeInputIndex]?.item) {
            const searchTerm = grnItems[activeInputIndex].item.toLowerCase();
            const filtered = allProducts.filter(product => product.name.toLowerCase().includes(searchTerm));
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(allProducts);
        }
    }, [grnItems, activeInputIndex, allProducts]);

    // Listen to changes in vendors collection based on search input
    useEffect(() => {
        if (!selectedVendor) {
            setVendorSuggestions([]);
            return;
        }

        const fetchVendors = async () => {
            const vendorsRef = collection(db, 'vendors');
            const q = query(
                vendorsRef,
                where('shopCode', '==', currentUser.shopCode),
                where('name', '>=', selectedVendor.toLowerCase()),
                where('name', '<=', selectedVendor.toLowerCase() + '\uf8ff')
            );

            const querySnapshot = await getDocs(q);
            const vendors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVendorSuggestions(vendors);
        };

        fetchVendors();
    }, [selectedVendor, currentUser.shopCode]);

    const handleItemChange = (index, value) => {
        const newGrnItems = [...grnItems];
        newGrnItems[index].item = value;
        setGrnItems(newGrnItems);
        setActiveInputIndex(index);
    };

    const handleFieldChange = (index, field, value) => {
        const newGrnItems = [...grnItems];
        newGrnItems[index][field] = value;
        setGrnItems(newGrnItems);
    };

    const handleProductSelect = (index, product) => {
        const newGrnItems = [...grnItems];
        newGrnItems[index].item = product.name;
        newGrnItems[index].uom = product.uom || 'PCS';
        newGrnItems[index].receivedCost = product.price || 0;
        setGrnItems(newGrnItems);
        setFilteredProducts([]);

        if (index === grnItems.length - 1) {
            setGrnItems([...grnItems, { item: '', uom: '', receivedQty: 0, foc: 0, fQty: 0, receivedCost: 0, discount: 0, netCost: 0, tax: 0, taxType: '', taxAmount: 0, costWithoutTax: 0, finalCost: 0 }]);
        }

        setActiveInputIndex(null);
    };

    const handleVendorSearch = (value) => {
        setSelectedVendor(value);
        setActiveVendor(true);
    };

    const handleVendorSelect = (vendor) => {
        setSelectedVendor(vendor.name);
        setVendorSuggestions([]);
        setActiveVendor(false);
    };

    const saveGrn = async (status) => {
        if (!selectedVendor) {
            setErrorMessage('Please select a vendor before placing the order.');
            return;
        }

        setErrorMessage('');

        try {
            const grnData = {
                items: grnItems,
                vendor: selectedVendor,
                status: status,
                shopCode: currentUser.shopCode,
                createdAt: new Date(),
                addedBy: currentUser.uid
            };

            await addDoc(collection(db, 'goodsReceiveNotes'), grnData);

            alert(`GRN ${status} successfully!`);

            await Promise.all(grnItems.map(async (item) => {
                const productQuery = query(
                    collection(db, 'products'),
                    where('name', '==', item.item),
                    where('shopCode', '==', currentUser.shopCode)
                );

                const querySnapshot = await getDocs(productQuery);
                if (!querySnapshot.empty) {
                    const product = querySnapshot.docs[0].data();
                    const productId = querySnapshot.docs[0].id;

                    // Update Product Stock
                    const newStock = product.stock + item.receivedQty;

                    const productRef = doc(db, 'products', productId);
                    await updateDoc(productRef, {
                        stock: newStock,
                    });

                    // Add to Product History
                    const historyData = {
                        productId: productId,
                        date: new Date(),
                        activityType: 'GRN',
                        description: `GRN created with quantity ${item.receivedQty}`,
                        quantity: item.receivedQty,
                        stock: newStock,
                        price: item.receivedCost,
                        updatedBy: currentUser.uid
                    };
                    await addDoc(collection(db, 'productHistory'), historyData);
                }
            }));
        } catch (error) {
            console.error('Error saving GRN:', error);
            alert('Failed to save GRN');
        }
    };

    return (
        <div className="local-purchase-order">
            <h2>Goods Receive Note</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="order-form-header">
                <input type="text" placeholder="Reference No: AUTO" readOnly />
                <input type="text" value={selectedVendor} onChange={(e) => handleVendorSearch(e.target.value)} placeholder="Vendor" />
                {vendorSuggestions.length > 0 && activeVendor && (
                    <ul className="dropdown">
                        {vendorSuggestions.map((vendor) => (
                            <li key={vendor.id} onClick={() => handleVendorSelect(vendor)}>
                                {vendor.name}
                            </li>
                        ))}
                    </ul>
                )}
                <input type="text" placeholder="Invoice No" />
                <input type="date" placeholder="Date" />
                <select>
                    <option value="CREDIT">Credit</option>
                    <option value="CASH">Cash</option>
                </select>
                <input type="text" placeholder="Terms" />
                <input type="text" placeholder="Note" />
            </div>
            <table className="order-items-table">
                <thead>
                    <tr>
                        <th>SN</th>
                        <th>Item</th>
                        <th>UOM</th>
                        <th>Received Qty</th>
                        <th>FOC</th>
                        <th>F-QTY</th>
                        <th>Received Cost</th>
                        <th>Discount</th>
                        <th>Net Cost</th>
                        <th>Tax %</th>
                        <th>Tax Type</th>
                        <th>Tax</th>
                        <th>Cost w/o Tax</th>
                        <th>Final Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {grnItems.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                                <input
                                    type="text"
                                    value={item.item}
                                    onChange={(e) => handleItemChange(index, e.target.value)}
                                    placeholder="Search or Scan the product"
                                    onFocus={() => setActiveInputIndex(index)}
                                />
                                {filteredProducts.length > 0 && activeInputIndex === index && (
                                    <ul className="dropdown">
                                        {filteredProducts.map((product) => (
                                            <li key={product.id} onClick={() => handleProductSelect(index, product)}>
                                                {product.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </td>
                            <td><input type="text" value={item.uom} onChange={(e) => handleFieldChange(index, 'uom', e.target.value)} /></td>
                            <td><input type="number" value={item.receivedQty} onChange={(e) => handleFieldChange(index, 'receivedQty', e.target.value)} /></td>
                            <td><input type="number" value={item.foc} onChange={(e) => handleFieldChange(index, 'foc', e.target.value)} /></td>
                            <td><input type="number" value={item.fQty} onChange={(e) => handleFieldChange(index, 'fQty', e.target.value)} /></td>
                            <td><input type="number" value={item.receivedCost} onChange={(e) => handleFieldChange(index, 'receivedCost', e.target.value)} /></td>
                            <td><input type="number" value={item.discount} onChange={(e) => handleFieldChange(index, 'discount', e.target.value)} /></td>
                            <td>{(item.receivedQty * item.receivedCost * (1 - item.discount / 100)).toFixed(3)}</td>
                            <td><input type="number" value={item.tax} onChange={(e) => handleFieldChange(index, 'tax', e.target.value)} /></td>
                            <td><input type="text" value={item.taxType} onChange={(e) => handleFieldChange(index, 'taxType', e.target.value)} /></td>
                            <td>{(item.taxAmount).toFixed(3)}</td>
                            <td>{(item.costWithoutTax).toFixed(3)}</td>
                            <td>{(item.finalCost).toFixed(3)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="order-total">
                <p>Net total: {grnItems.reduce((total, item) => total + item.finalCost, 0).toFixed(3)}</p>
            </div>
            <div className="order-actions">
                <button className="create-btn" onClick={() => saveGrn('posted')}>Post</button>
                <button className="save-draft-btn" onClick={() => saveGrn('draft')}>Save Draft</button>
            </div>
        </div>
    );
};

export default GoodsReceiveNote;
