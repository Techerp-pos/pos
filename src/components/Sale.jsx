import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal'; // Assuming you have a modal component
import '../utility/Sale.css';

function Sale() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [localCart, setLocalCart] = useState([]);
  const [paymentType, setPaymentType] = useState('');
  const [showPaymentComplete, setShowPaymentComplete] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const { dispatch } = useContext(CartContext);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoryCollection = collection(db, 'categories');
      const categorySnapshot = await getDocs(categoryCollection);
      setCategories(categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchProducts = async () => {
      const productsRef = collection(db, 'products');
      const productSnapshot = await getDocs(productsRef);
      const allProducts = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        price: parseFloat(doc.data().price),
        stock: parseInt(doc.data().stock, 10),
        quantity: 0,
      }));
      setProducts(allProducts);
    };

    fetchCategories();
    fetchProducts();

    const cartFromLocalStorage = localStorage.getItem('cart');
    if (cartFromLocalStorage) {
      setLocalCart(JSON.parse(cartFromLocalStorage));
    }
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setProducts(products.filter(product => product.category === category.name));
  };

  const handleQuantityChange = (product, quantity) => {
    if (quantity < 0) return;
    const updatedCart = localCart.map(item => item.id === product.id
      ? { ...item, quantity }
      : item
    ).filter(item => item.quantity > 0);

    if (!updatedCart.find(item => item.id === product.id) && quantity > 0) {
      updatedCart.push({ ...product, quantity });
    }

    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleSearch = () => {
    const product = products.find(p =>
      p.name.toLowerCase() === searchInput.toLowerCase() ||
      p.barcode === searchInput ||
      p.code === searchInput
    );
    if (product) {
      handleQuantityChange(product, 1);
      setSearchInput(''); // Clear the input after adding the product to the cart
    } else {
      console.log('Product not found:', searchInput);
    }
  };

  const calculateTotal = () => {
    const subtotal = localCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return subtotal - discount;
  };

  const handleMakePayment = async () => {
    const orderId = await generateOrderId(); // Assuming you have a function to generate order IDs
    try {
      await setDoc(doc(db, 'orders', orderId), {
        orderId,
        orderDate: new Date().toISOString().split('T')[0],
        cart: localCart,
        total: calculateTotal().toFixed(2),
        status: 'Completed',
        paymentType: paymentType,
        addedBy: currentUser.uid,
        timestamp: new Date(),
      });
      setShowPaymentComplete(true);
      setTimeout(() => {
        setShowPaymentComplete(false);
        setLocalCart([]);
        dispatch({ type: 'CLEAR_CART' });
        localStorage.removeItem('cart');
      }, 5000);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="sale-container">
      <div className="category-section">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-button ${selectedCategory && selectedCategory.id === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="product-section">
        <input
          type="text"
          value={searchInput}
          placeholder="Search by name, barcode, or code"
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card" onClick={() => handleQuantityChange(product, 1)}>
              <img src={product.imageUrl} alt={product.name} />
              <h3>{product.name}</h3>
              <p>{product.price.toFixed(2)} OMR</p>
            </div>
          ))}
        </div>
      </div>
      <div className="cart-section">
        <h2>Cart</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {localCart.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.price.toFixed(2)}</td>
                <td>{(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button onClick={() => handleQuantityChange(item, item.quantity - 1)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cart-summary">
          <p>Total: {calculateTotal().toFixed(2)} OMR</p>
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            <option value="">Select Payment Type</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
          <button onClick={handleMakePayment} disabled={!paymentType}>Make Payment</button>
        </div>
      </div>
      {showPaymentComplete && (
        <Modal>
          <div className="payment-complete-popup">
            <p>Payment Complete!</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Sale;
