import React, { useState, useEffect } from 'react';
import { collection, doc, query, where, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import '../utility/Lpo.css';

const LocalPurchaseOrder = () => {
    const { currentUser } = useAuth();
    const [orderItems, setOrderItems] = useState([{ item: '', uom: '', quantity: 1, cost: 0, tax: 0, totalCost: 0, barcode: '' }]);
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
        if (orderItems[activeInputIndex]?.item) {
            const searchTerm = orderItems[activeInputIndex].item.toLowerCase();
            const filtered = allProducts.flatMap(product =>
                (product.pricing || []).map(priceOption => ({
                    ...product,
                    ...priceOption,
                    displayName: `${product.name} (${priceOption.unitType} - ${priceOption.factor})`
                }))
            ).filter(item => item.displayName.toLowerCase().includes(searchTerm));
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(allProducts);
        }
    }, [orderItems, activeInputIndex, allProducts]);

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
        const newOrderItems = [...orderItems];
        newOrderItems[index].item = value;
        setOrderItems(newOrderItems);
        setActiveInputIndex(index);
    };

    const handleFieldChange = (index, field, value) => {
        const newOrderItems = [...orderItems];
        newOrderItems[index][field] = value || '';  // Ensure no undefined values
        setOrderItems(newOrderItems);
    };

    const handleProductSelect = (index, product) => {
        const newOrderItems = [...orderItems];
        newOrderItems[index].item = product.displayName;
        newOrderItems[index].uom = product.unitType;
        newOrderItems[index].cost = parseFloat(product.price) || 0;
        newOrderItems[index].barcode = product.barcode || '';
        setOrderItems(newOrderItems);
        setFilteredProducts([]);

        if (index === orderItems.length - 1) {
            setOrderItems([...orderItems, { item: '', uom: '', quantity: 1, cost: 0, tax: 0, totalCost: 0, barcode: '' }]);
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

    const generateNumericId = async () => {
        const lastOrderRef = collection(db, 'purchaseOrders');
        const lastOrderQuery = query(lastOrderRef, where('shopCode', '==', currentUser.shopCode));
        const querySnapshot = await getDocs(lastOrderQuery);

        if (!querySnapshot.empty) {
            const lastOrder = querySnapshot.docs[querySnapshot.docs.length - 1];
            const lastOrderId = parseInt(lastOrder.id, 10);
            return (lastOrderId + 1).toString().padStart(5, '0');
        } else {
            return '00001';
        }
    };

    const saveOrder = async (status) => {
        if (!selectedVendor) {
            setErrorMessage('Please select a vendor before placing the order.');
            return;
        }

        setErrorMessage('');

        try {
            const numericId = await generateNumericId();

            const orderData = {
                items: orderItems,
                vendor: selectedVendor,
                status: status,
                shopCode: currentUser.shopCode,
                createdAt: new Date(),
                addedBy: currentUser.uid
            };

            await setDoc(doc(db, 'purchaseOrders', numericId), orderData);

            alert(`Order ${status} successfully!`);

            await Promise.all(orderItems.map(async (item) => {
                const productQuery = query(
                    collection(db, 'products'),
                    where('name', '==', item.item.split(' (')[0]), // match product name only
                    where('unitType', '==', item.uom), // match unitType
                    where('shopCode', '==', currentUser.shopCode)
                );

                const querySnapshot = await getDocs(productQuery);
                if (!querySnapshot.empty) {
                    const product = querySnapshot.docs[0].data();
                    const productId = querySnapshot.docs[0].id;

                    const batchNumber = numericId;
                    const batchData = {
                        batchNumber: batchNumber,
                        batchDate: new Date(),
                        initialQty: item.quantity,
                        remainingQty: item.quantity,
                        receivedCost: item.cost,
                        currentCost: item.cost,
                        productId: productId,
                        shopCode: currentUser.shopCode
                    };
                    await addDoc(collection(db, 'productBatches'), batchData);

                    // Update Product Stock and Price
                    const newStock = product.stock + item.quantity;
                    const newPrice = item.cost; // Update product price to new cost

                    const productRef = doc(db, 'products', productId);
                    await updateDoc(productRef, {
                        stock: newStock,
                        price: newPrice,
                    });

                    // Add to Product History
                    const historyData = {
                        productId: productId,
                        date: new Date(),
                        activityType: 'LPO',
                        description: `LPO created with batch number ${batchNumber}`,
                        quantity: item.quantity,
                        stock: newStock,
                        price: newPrice,
                        updatedBy: currentUser.uid
                    };
                    await addDoc(collection(db, 'productHistory'), historyData);
                }
            }));
        } catch (error) {
            console.error('Error saving order:', error);
            alert('Failed to save order');
        }
    };

    return (
        <div className="local-purchase-order">
            <h2>Local Purchase Order</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="order-form">
                <div className="order-form-header">
                    <label>Reference No: AUTO</label>
                    <input
                        type="text"
                        value={selectedVendor}
                        onChange={(e) => handleVendorSearch(e.target.value)}
                        placeholder="Vendor"
                        onFocus={() => setActiveVendor(true)}
                    />
                    {vendorSuggestions.length > 0 && activeVendor && (
                        <ul className="dropdown">
                            {vendorSuggestions.map((vendor) => (
                                <li key={vendor.id} onClick={() => handleVendorSelect(vendor)}>
                                    {vendor.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    <input type="text" placeholder="Note" />
                    <input type="date" placeholder="Date" />
                    <input type="date" placeholder="Expected Date" />
                </div>
                <table className="order-items-table">
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>Item</th>
                            <th>UOM</th>
                            <th>Quantity</th>
                            <th>Cost</th>
                            <th>Tax %</th>
                            <th>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <input
                                        type="text"
                                        value={item.item}
                                        onChange={(e) => handleItemChange(index, e.target.value)}
                                        placeholder="Search or scan item"
                                        onFocus={() => setActiveInputIndex(index)}
                                    />
                                    {filteredProducts.length > 0 && activeInputIndex === index && (
                                        <ul className="dropdown">
                                            {filteredProducts.map((product) => (
                                                <li key={product.id} onClick={() => handleProductSelect(index, product)}>
                                                    {product.displayName}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={item.uom}
                                        onChange={(e) => handleFieldChange(index, 'uom', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.cost}
                                        onChange={(e) => handleFieldChange(index, 'cost', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.tax}
                                        onChange={(e) => handleFieldChange(index, 'tax', e.target.value)}
                                    />
                                </td>
                                <td>{(item.quantity * item.cost * (1 + item.tax / 100)).toFixed(3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="order-total">
                    <p>Net total: {orderItems.reduce((total, item) => total + item.quantity * item.cost * (1 + item.tax / 100), 0).toFixed(3)}</p>
                </div>
                <div className="order-actions">
                    <button className="create-btn" onClick={() => saveOrder('completed')}>Create</button>
                    <button className="create-print-btn" onClick={() => saveOrder('completed')}>Create and Print</button>
                    <button className="save-draft-btn" onClick={() => saveOrder('draft')}>Save Draft</button>
                </div>
            </div>
        </div>
    );
};

export default LocalPurchaseOrder;
