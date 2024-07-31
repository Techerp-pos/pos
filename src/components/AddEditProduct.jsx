// src/components/AddEditProduct.js
import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../config/firebase';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JsBarcode from 'jsbarcode';
import { useAuth } from '../contexts/AuthContext';

function AddEditProduct({ onClose, product: initialProduct }) {
  const { currentUser } = useAuth();
  const [product, setProduct] = useState({
    code: 0,
    name: '',
    shortName: '',
    localName: '',
    vendor: '',
    department: '',
    category: '',
    taxType: '',
    barcode: 0,
    stock: 0,
    price: 0,
    imageUrl: '',
    addedBy: currentUser ? currentUser.uid : 'Unknown'
  });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const { id } = useParams();
  const barcodeRef = useRef();
  const imageRef = useRef();

  useEffect(() => {
    if (initialProduct) {
      setIsEdit(true);
      setProduct({
        ...initialProduct,
        code: parseInt(initialProduct.code, 10),
        barcode: parseInt(initialProduct.barcode, 10),
        price: parseFloat(initialProduct.price),
        stock: parseInt(initialProduct.stock, 10),
      });
    } else {
      const fetchLatestProduct = async () => {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('code', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size > 0) {
          const latestProduct = querySnapshot.docs[0].data();
          setProduct(prevState => ({
            ...prevState,
            code: parseInt(latestProduct.code, 10) + 1,
            barcode: parseInt(latestProduct.barcode, 10) + 1,
          }));
        } else {
          setProduct(prevState => ({
            ...prevState,
            code: 3,
            barcode: 1300000000000,
          }));
        }
      };
      fetchLatestProduct();
    }
  }, [initialProduct]);

  useEffect(() => {
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

    fetchDepartments();
    fetchCategories();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...product,
        code: product.code.toString().padStart(3, '0'),
        barcode: product.barcode.toString().padStart(13, '0'),
        price: parseFloat(product.price).toFixed(3),
        stock: parseInt(product.stock, 10),
      };

      if (isEdit) {
        await setDoc(doc(db, 'products', initialProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      onClose();
    } catch (error) {
      console.error('Error adding/updating product: ', error);
      alert('Failed to add/update product');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: name === 'price' || name === 'stock' || name === 'code' || name === 'barcode' ? parseFloat(value) : value });
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
        addedBy: currentUser.uid
      });
      setCategories([...categories, { id: docRef.id, name: newCategory }]);
      setProduct(prevState => ({ ...prevState, category: newCategory }));
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category: ', error);
    }
  };

  return (
    <div className="AddEditProduct">
      <h2>{isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Code</label>
          <input
            type="number"
            name="code"
            value={product.code}
            onChange={handleChange}
            readOnly={isEdit}
          />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Short Name</label>
          <input
            type="text"
            name="shortName"
            value={product.shortName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Local Name</label>
          <input
            type="text"
            name="localName"
            value={product.localName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Vendor</label>
          <input
            type="text"
            name="vendor"
            value={product.vendor}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Department</label>
          <select
            name="department"
            value={product.department}
            onChange={handleChange}
            required
          >
            <option>Select</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <div className="category-selection">
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              required
            >
              <option>Select</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
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
        <div className="form-group">
          <label>Tax Type</label>
          <input
            type="text"
            name="taxType"
            value={product.taxType}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Barcode</label>
          <input
            type="number"
            name="barcode"
            value={product.barcode}
            onChange={handleChange}
            required
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const scannerInput = e.target.value.trim();
                setProduct({ ...product, barcode: parseInt(scannerInput, 10) });
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
        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={product.price}
            step="0.001"
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Product Image</label>
          <input
            type="file"
            ref={imageRef}
            onChange={handleImageChange}
          />
          {product.imageUrl && <img src={product.imageUrl} alt="Product" />}
        </div>
        <button type="submit" className="submit-btn">{isEdit ? 'Update Product' : 'Add Product'}</button>
      </form>
    </div>
  );
}

export default AddEditProduct;
