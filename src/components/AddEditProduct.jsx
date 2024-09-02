import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../config/firebase';
import { doc, setDoc, addDoc, collection, getDocs, query, orderBy, where, limit, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JsBarcode from 'jsbarcode';
import { useAuth } from '../contexts/AuthContext';
import '../utility/AddEditProduct.css';

function AddEditProduct({ onClose, product: initialProduct }) {
  const { currentUser } = useAuth();
  const [product, setProduct] = useState({
    code: '',
    name: '',
    shortName: '',
    localName: '',
    vendor: '',
    department: '',
    category: '',
    taxType: 'vat 5%', // Set default tax type
    vat: 5, // Initial VAT value based on default taxType
    barcode: '',
    stock: 0, // Added stock input field
    pricing: [{ unitType: 'PCS', factor: 1, price: '', margin: '', barcode: '' }],
    imageUrl: '',
    addedBy: currentUser ? currentUser.uid : 'Unknown',
    shopCode: currentUser.shopCode
  });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [history, setHistory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [activeTab, setActiveTab] = useState('product');
  const barcodeRef = useRef();
  const imageRef = useRef();

  useEffect(() => {
    if (initialProduct) {
      setProduct({
        ...initialProduct,
        code: initialProduct.code,
        barcode: initialProduct.barcode,
        stock: initialProduct.stock,
        pricing: initialProduct.pricing || [{ unitType: 'PCS', factor: 1, price: '', margin: '', barcode: '' }],
        vat: initialProduct.taxType === 'vat 5%' ? 5 : 0, // Initialize VAT based on taxType
      });
      fetchProductHistory(initialProduct.id);
      fetchBatches(initialProduct.id);
    } else {
      fetchLatestProduct();
    }
  }, [initialProduct]);

  const fetchLatestProduct = async () => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('code', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.size > 0) {
      const latestProduct = querySnapshot.docs[0].data();
      setProduct(prevState => ({
        ...prevState,
        code: (parseInt(latestProduct.code, 10) + 1).toString().padStart(3, '0'),
        barcode: (parseInt(latestProduct.barcode, 10) + 1).toString().padStart(13, '0'),
      }));
    } else {
      setProduct(prevState => ({
        ...prevState,
        code: '001',
        barcode: '1300000000001',
      }));
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchCategories();
    fetchVendors();
  }, []);

  const fetchDepartments = async () => {
    const departmentCollection = collection(db, 'departments');
    const departmentSnapshot = await getDocs(departmentCollection);
    setDepartments(departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchCategories = async () => {
    const categoryCollection = collection(db, 'categories');
    const categorySnapshot = await getDocs(categoryCollection);
    setCategories(categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchVendors = async () => {
    const vendorsCollection = collection(db, 'vendors');
    const vendorsSnapshot = await getDocs(vendorsCollection);
    setVendors(vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    if (product.barcode) {
      JsBarcode(barcodeRef.current, String(product.barcode));
    }
  }, [product.barcode]);

  const handleImageUpload = async (file) => {
    const storageRef = ref(storage, `product_images/${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    setProduct(prevState => ({ ...prevState, imageUrl }));
  };

  const handleAddPricing = () => {
    setProduct(prevState => ({
      ...prevState,
      pricing: [...prevState.pricing, { unitType: '', factor: '', price: '', margin: '', barcode: '' }]
    }));
  };

  const handlePricingChange = (index, field, value) => {
    const updatedPricing = [...product.pricing];
    updatedPricing[index][field] = value;
    setProduct({ ...product, pricing: updatedPricing });
  };

  const handleRemovePricing = (index) => {
    const updatedPricing = product.pricing.filter((_, i) => i !== index);
    setProduct({ ...product, pricing: updatedPricing });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'taxType') {
      // Update VAT value based on selected taxType
      const vatValue = value === 'vat 5%' ? 5 : 0;
      setProduct({ ...product, taxType: value, vat: vatValue });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...product,
        code: product.code.toString().padStart(3, '0'),
        barcode: product.barcode.toString().padStart(13, '0'),
        stock: parseInt(product.stock, 10),
      };

      let action;
      let productId;
      if (initialProduct) {
        await setDoc(doc(db, 'products', initialProduct.id), productData);
        action = 'Update';
        productId = initialProduct.id;
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        action = 'Create';
        productId = docRef.id;
      }

      // Generate and save batch
      const batchData = {
        batchNumber: generateBatchNumber(),
        batchDate: new Date(),
        initialQty: productData.stock,
        remainingQty: productData.stock,
        receivedCost: productData.pricing[0].price,
        currentCost: productData.pricing[0].price,
        productId: productId,
        shopCode: currentUser.shopCode,
      };
      await addDoc(collection(db, 'productBatches'), batchData);

      // Update history
      const stockChange = productData.stock - (initialProduct?.stock || 0);
      await addDoc(collection(db, 'productHistory'), {
        productId: productId,
        date: new Date(),
        activityType: action,
        description: `${action} product ${productData.name}`,
        quantity: `${stockChange > 0 ? '+' : ''}${stockChange}`,
        stock: productData.stock,
        price: productData.pricing[0].price,
        updatedBy: currentUser.email,
      });

      onClose();
    } catch (error) {
      console.error('Error adding/updating product: ', error);
      alert('Failed to add/update product');
    }
  };

  const fetchBatches = async (productId) => {
    const batchRef = collection(db, 'productBatches');
    const q = query(batchRef, where('productId', '==', productId), orderBy('batchDate', 'desc'));
    const batchSnapshot = await getDocs(q);
    setBatches(batchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchProductHistory = async (productId) => {
    const historyRef = collection(db, 'productHistory');
    const q = query(historyRef, where('productId', '==', productId), orderBy('date', 'desc'));
    const historySnapshot = await getDocs(q);
    setHistory(historySnapshot.docs.map(doc => doc.data()));
  };

  const handleFilterHistory = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end date');
      return;
    }

    const historyRef = collection(db, 'productHistory');
    const q = query(
      historyRef,
      where('productId', '==', initialProduct.id),
      where('date', '>=', new Date(startDate)),
      where('date', '<=', new Date(endDate))
    );
    const historySnapshot = await getDocs(q);
    setHistory(historySnapshot.docs.map(doc => doc.data()));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() === '') return;
    setShowNewCategoryInput(false);

    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: newCategory,
        addedBy: currentUser.uid,
      });
      setCategories([...categories, { id: docRef.id, name: newCategory }]);
      setProduct(prevState => ({ ...prevState, category: newCategory }));
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category: ', error);
    }
  };

  const handleBatchChange = async (batchId, field, value) => {
    const updatedBatches = batches.map(batch =>
      batch.id === batchId ? { ...batch, [field]: value } : batch
    );
    setBatches(updatedBatches);

    const batchDocRef = doc(db, 'productBatches', batchId);
    await updateDoc(batchDocRef, { [field]: value });
  };

  const generateBatchNumber = () => {
    return `BATCH-${Date.now()}`;
  };

  return (
    <div className='product-modal-container'>
      <div className="modal-header">
        <h2>{initialProduct ? `${product.name}` : 'Add New Product'}</h2>
        <button className="close-button" onClick={onClose}>X</button>
      </div>
      <div className="modal-tabs">
        <button
          className={`tab-btn ${activeTab === 'product' ? 'active' : ''}`}
          onClick={() => setActiveTab('product')}
        >
          Product
        </button>
        <button
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          Stock Batch
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Product Images
        </button>
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          More Info
        </button>
      </div>
      <form onSubmit={handleSubmit} className="product-form">
        {activeTab === 'product' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Code</label>
              <input
                type="text"
                name="code"
                value={product.code}
                onChange={handleChange}
                readOnly={!!initialProduct}
              />
            </div>
            <div className="form-group dual-input">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
              />
              <label>Short Name</label>
              <input
                type="text"
                name="shortName"
                value={product.shortName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group dual-input">
              <label>Local Name</label>
              <input
                type="text"
                name="localName"
                value={product.localName}
                onChange={handleChange}
              />
              <label>Vendor</label>
              <select
                name="vendor"
                value={product.vendor}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group dual-input">
              <label>Department</label>
              <select
                name="department"
                value={product.department}
                onChange={handleChange}
              >
                <option value="" disabled>Select Department</option>
                {departments.map(department => (
                  <option key={department.id} value={department.name}>{department.name}</option>
                ))}
              </select>
              <label>Category</label>
              <div className="category-selection">
                <select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
                <button type="button" className="add-category-btn" onClick={() => setShowNewCategoryInput(true)}>+</button>
              </div>
              {showNewCategoryInput && (
                <div className="new-category-input">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New Category"
                    required
                  />
                  <button type="button" onClick={handleAddCategory}>Add</button>
                </div>
              )}
            </div>
            <div className="form-group dual-input">
              <label>Tax Type</label>
              <select
                name="taxType"
                value={product.taxType}
                onChange={handleChange}
              >
                <option value="vat 0%">VAT 0%</option>
                <option value="vat 5%">VAT 5%</option>
              </select>
              <label>Barcode</label>
              <input
                type="number"
                name="barcode"
                value={product.barcode}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const scannerInput = e.target.value.trim();
                    setProduct({ ...product, barcode: scannerInput });
                  }
                }}
              />
              <svg ref={barcodeRef}></svg>
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                required
              />
            </div>
            <button type="button" onClick={handleAddPricing}>
              +
            </button>
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Unit Type</th>
                  <th>Factor</th>
                  <th>Cost without & with Tax</th>
                  <th>Margin %</th>
                  <th>Price with Tax</th>
                  <th>Barcodes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {product.pricing.map((pricingItem, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={pricingItem.unitType}
                        onChange={(e) => handlePricingChange(index, 'unitType', e.target.value)}
                        required
                      >
                        <option value="PCS">PCS</option>
                        <option value="Each">Each</option>
                        <option value="Pack">Pack</option>
                        <option value="Box">Box</option>
                        <option value="Carton">Carton</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={pricingItem.factor}
                        onChange={(e) => handlePricingChange(index, 'factor', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={pricingItem.price}
                        onChange={(e) => handlePricingChange(index, 'price', e.target.value)}
                        required
                      />
                      {/* Calculate cost including VAT */}
                      <input
                        type="number"
                        value={(pricingItem.price * (1 + product.vat / 100)).toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={pricingItem.margin}
                        onChange={(e) => handlePricingChange(index, 'margin', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={(pricingItem.price * (1 + product.vat / 100)).toFixed(2)}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={pricingItem.barcode}
                        onChange={(e) => handlePricingChange(index, 'barcode', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const scannerInput = e.target.value.trim();
                            handlePricingChange(index, 'barcode', scannerInput);
                          }
                        }}
                      />
                    </td>
                    <td>
                      {index > 0 && (
                        <button type="button" onClick={() => handleRemovePricing(index)}>
                          X
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'stock' && (
          <div className="tab-content">
            <h3>Stock Batches</h3>
            <table className="batch-table">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Batch Date</th>
                  <th>Initial Qty</th>
                  <th>Remaining Qty</th>
                  <th>Received Cost</th>
                  <th>Current Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.id}>
                    <td>{batch.batchNumber}</td>
                    <td>{new Date(batch.batchDate.seconds * 1000).toLocaleDateString()}</td>
                    <td>{batch.initialQty}</td>
                    <td>
                      <input
                        type="number"
                        value={batch.remainingQty}
                        onChange={(e) => handleBatchChange(batch.id, 'remainingQty', e.target.value)}
                      />
                    </td>
                    <td>{batch.receivedCost}</td>
                    <td>
                      <input
                        type="number"
                        value={batch.currentCost}
                        onChange={(e) => handleBatchChange(batch.id, 'currentCost', e.target.value)}
                      />
                    </td>
                    <td>
                      {/* Add any other actions like deleting a batch if necessary */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="tab-content">
            <div className="history-filter">
              <div className="form-group dual-input">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button type="button" onClick={handleFilterHistory} className='save-btn'>Load</button>
            </div>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity Type</th>
                  <th>Description</th>
                  <th>Quantity Change</th>
                  <th>Stock</th>
                  <th>Price Change</th>
                  <th>Price</th>
                  <th>Updated By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={index}>
                    <td>{new Date(record.date.seconds * 1000).toLocaleDateString()}</td>
                    <td>{record.activityType}</td>
                    <td>{record.description}</td>
                    <td>{record.quantity}</td>
                    <td>{record.stock}</td>
                    <td>{record.priceChange}</td>
                    <td>{record.price}</td>
                    <td>{record.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'images' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Product Image</label>
              <input
                type="file"
                ref={imageRef}
                onChange={handleImageChange}
              />
              {product.imageUrl && <img src={product.imageUrl} alt="Product" />}
            </div>
          </div>
        )}
        {activeTab === 'info' && (
          <div className="tab-content">
            <p>More product info...</p>
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="delete-btn">Delete</button>
          <button type="submit" className="save-btn">
            {initialProduct ? 'Update Product' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddEditProduct;
