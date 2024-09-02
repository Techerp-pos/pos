import React, { useState, useEffect } from 'react';
import { collection, doc, query, where, updateDoc, getDocs, setDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';
import '../utility/Lpo.css';

const GoodsReturnVoucher = () => {
    const { currentUser } = useAuth();
    const [returnItems, setReturnItems] = useState([{ item: '', uom: '', receivedQty: 0, cost: 0, tax: 0, totalCost: 0, barcode: '' }]);
    const [allProducts, setAllProducts] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [totalNetCost, setTotalNetCost] = useState(0);
    const [totalTax, setTotalTax] = useState(0);

    // Load all products when the page mounts
    useEffect(() => {
        const fetchProducts = async () => {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('shopCode', '==', currentUser.shopCode));
            const querySnapshot = await getDocs(q);
            const products = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                options: (doc.data().pricing || []).map(priceOption => ({
                    label: `${doc.data().name} (${priceOption.unitType} - ${priceOption.factor})`,
                    value: doc.id,
                    uom: priceOption.unitType,
                    cost: priceOption.price,
                    barcode: doc.data().barcode
                }))
            }));
            setAllProducts(products);
        };

        fetchProducts();
    }, [currentUser.shopCode]);

    // Handle selection of a product in the return voucher
    const handleProductSelect = (index, selectedOption) => {
        const newReturnItems = [...returnItems];
        const product = allProducts.find(p => p.id === selectedOption.value);
        if (product) {
            const pricingOption = product.options.find(option => option.label === selectedOption.label);
            newReturnItems[index] = {
                item: selectedOption.label,
                uom: pricingOption.uom,
                receivedQty: 1,
                cost: pricingOption.cost || 0,
                tax: 0, // Default tax value
                totalCost: pricingOption.cost,
                barcode: pricingOption.barcode || ''
            };
            setReturnItems(newReturnItems);
            updateTotals(newReturnItems);
        }
    };

    // Handle changes in the quantity, cost, or tax fields
    const handleFieldChange = (index, field, value) => {
        const newReturnItems = [...returnItems];
        newReturnItems[index][field] = value || '';  // Ensure no undefined values
        if (field === 'receivedQty' || field === 'cost' || field === 'tax') {
            newReturnItems[index].totalCost = (newReturnItems[index].receivedQty * newReturnItems[index].cost * (1 + newReturnItems[index].tax / 100)).toFixed(2);
        }
        setReturnItems(newReturnItems);
        updateTotals(newReturnItems);
    };

    // Update total cost and total tax
    const updateTotals = (items) => {
        const totalCost = items.reduce((total, item) => total + parseFloat(item.totalCost || 0), 0);
        const totalTax = items.reduce((total, item) => total + (item.receivedQty * item.cost * (item.tax / 100)), 0);
        setTotalNetCost(totalCost.toFixed(2));
        setTotalTax(totalTax.toFixed(2));
    };

    // Generate a new ID for the goods return voucher
    const generateNumericId = async () => {
        const lastReturnRef = collection(db, 'goodsReturnVouchers');
        const lastReturnQuery = query(lastReturnRef, where('shopCode', '==', currentUser.shopCode));
        const querySnapshot = await getDocs(lastReturnQuery);

        if (!querySnapshot.empty) {
            const lastReturn = querySnapshot.docs[querySnapshot.docs.length - 1];
            const lastReturnId = parseInt(lastReturn.id, 10);
            return (lastReturnId + 1).toString().padStart(5, '0');
        } else {
            return '00001';
        }
    };

    // Save the goods return voucher and update stocks and history
    const saveReturn = async (status = 'GRV') => {
        if (!selectedVendor) {
            setErrorMessage('Please select a vendor before saving the return.');
            return;
        }
    
        setErrorMessage('');
    
        try {
            const numericId = await generateNumericId();
    
            const returnData = {
                items: returnItems,
                vendor: selectedVendor,
                status: status,  // Ensure status is set as 'GRV'
                shopCode: currentUser.shopCode,
                createdAt: new Date(),
                addedBy: currentUser.uid
            };
    
            await setDoc(doc(db, 'goodsReturnVouchers', numericId), returnData);
    
            console.log('Goods Return Voucher saved successfully:', numericId);
    
            await Promise.all(returnItems.map(async (item) => {
                const productQuery = query(
                    collection(db, 'products'),
                    where('name', '==', item.item.split(' (')[0]), // match product name only
                    where('shopCode', '==', currentUser.shopCode)
                );
    
                const querySnapshot = await getDocs(productQuery);
                if (!querySnapshot.empty) {
                    const product = querySnapshot.docs[0].data();
                    const productId = querySnapshot.docs[0].id;
    
                    // Update Product Stock
                    const newStock = product.stock - item.receivedQty;
                    const productRef = doc(db, 'products', productId);
                    await updateDoc(productRef, {
                        stock: newStock,
                    });
    
                    console.log(`Updated stock for product ID: ${productId}. New stock: ${newStock}`);
    
                    // Update Stock Batch
                    const batchRef = collection(db, 'productBatches');
                    const batchQuery = query(batchRef, where('productId', '==', productId), orderBy('batchDate', 'asc'));
                    const batchSnapshot = await getDocs(batchQuery);
    
                    let qtyToDeduct = item.receivedQty;
    
                    for (const batchDoc of batchSnapshot.docs) {
                        const batchData = batchDoc.data();
                        const remainingQty = batchData.remainingQty;
    
                        if (remainingQty > 0) {
                            const deductQty = Math.min(remainingQty, qtyToDeduct);
                            const updatedQty = remainingQty - deductQty;
                            await updateDoc(batchDoc.ref, { remainingQty: updatedQty });
    
                            qtyToDeduct -= deductQty;
                            console.log(`Deducted ${deductQty} from batch ${batchDoc.id}. Remaining qty in batch: ${updatedQty}`);
                            if (qtyToDeduct <= 0) break;
                        }
                    }
    
                    // Add to Product History
                    const historyData = {
                        productId: productId,
                        date: new Date(),
                        activityType: 'GRV', // Activity type set to GRV
                        description: `Goods Return Voucher created`,
                        quantity: -item.receivedQty, // Deducted quantity recorded
                        stock: newStock, // Updated stock after deduction
                        price: item.cost,
                        updatedBy: currentUser.uid
                    };
                    await addDoc(collection(db, 'productHistory'), historyData);
    
                    console.log(`Product history updated for product ID: ${productId}`);
                } else {
                    console.error(`Product not found: ${item.item}`);
                }
            }));
        } catch (error) {
            console.error('Error saving return:', error);
            alert('Failed to save return');
        }
    };

    return (
        <div className="goods-return-voucher">
            <h2>Goods Return Voucher</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <div className="order-form">
                <div className="order-form-header">
                    <label>Reference No: AUTO</label>
                    <input
                        type="text"
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        placeholder="Vendor"
                    />
                    <input type="date" placeholder="Date" />
                    <input type="text" placeholder="Mode" />
                    <input type="text" placeholder="Terms" />
                </div>
                <table className="order-items-table">
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>Item</th>
                            <th>UOM</th>
                            <th>Received Qty</th>
                            <th>Cost</th>
                            <th>Tax %</th>
                            <th>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returnItems.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <Select
                                        options={allProducts.flatMap(product => product.options)}
                                        onChange={(selectedOption) => handleProductSelect(index, selectedOption)}
                                        placeholder="Search or scan item"
                                    />
                                </td>
                                <td>{item.uom}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.receivedQty}
                                        onChange={(e) => handleFieldChange(index, 'receivedQty', e.target.value)}
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
                                <td>{item.totalCost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="order-total">
                    <p>Net total: {totalNetCost}</p>
                    <p>Net tax: {totalTax}</p>
                </div>
                <div className="order-actions">
                    <button className="save-draft-btn" onClick={() => saveReturn('draft')}>Save Draft</button>
                    <button className="post-btn" onClick={() => saveReturn('GRV')}>Post</button>
                </div>
            </div>
        </div>
    );
};

export default GoodsReturnVoucher;
