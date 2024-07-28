import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal'; // Assuming you have a modal component

function Sale() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [shopDetails, setShopDetails] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [localCart, setLocalCart] = useState([]);
  const [paymentType, setPaymentType] = useState('');
  const [showPaymentComplete, setShowPaymentComplete] = useState(false);

  const { dispatch } = useContext(CartContext);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoryCollection = collection(db, 'categories');
      const categorySnapshot = await getDocs(categoryCollection);
      setCategories(categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchShopDetails = async () => {
      if (currentUser) {
        const shopDoc = await getDoc(doc(db, 'shopDetails', currentUser.uid));
        if (shopDoc.exists()) {
          setShopDetails(shopDoc.data());
        }
      }
    };

    const fetchOrders = () => {
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, where('status', '!=', 'completed'), where('addedBy', '==', currentUser.uid));

      onSnapshot(q, (querySnapshot) => {
        setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    };

    fetchCategories();
    fetchShopDetails();
    fetchOrders();
  }, [currentUser]);

  const fetchProducts = async (categoryName = null) => {
    const productsRef = collection(db, 'products');
    let q;
    if (categoryName) {
      q = query(productsRef, where('category', '==', categoryName), where('addedBy', '==', currentUser.uid));
    } else {
      q = query(productsRef, where('addedBy', '==', currentUser.uid));
    }
    const productSnapshot = await getDocs(q);
    setProducts(productSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        quantity: 0,
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock, 10)
      };
    }));
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchProducts(category ? category.name : null);
  };

  const handleQuantityChange = (product, quantity) => {
    if (quantity < 0) return;

    const updatedCart = localCart.map(item =>
      item.id === product.id ? { ...item, quantity } : item
    ).filter(item => item.quantity > 0);

    if (!updatedCart.find(item => item.id === product.id) && quantity > 0) {
      updatedCart.push({ ...product, quantity });
    } else {
      updatedCart.forEach(item => {
        if (item.id === product.id) {
          item.quantity = quantity;
        }
      });
    }

    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleRemoveFromCart = (productId) => {
    const updatedCart = localCart.filter(item => item.id !== productId);
    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const calculateSubtotal = () => {
    return localCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount;
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setLocalCart(order.cart);
    dispatch({ type: 'SET_CART', payload: order.cart });
  };

  const handleMakePayment = async () => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'completed',
        paymentType: paymentType,
      });
      setShowPaymentComplete(true);
      setTimeout(() => {
        setShowPaymentComplete(false);
        setSelectedOrder(null);
        setPaymentType('');
      }, 3000);
    } catch (error) {
      console.error('Error completing transaction: ', error);
      alert('Failed to complete transaction');
    }
  };

  return (
    <div className="sale-order">
      <div style={{ display: 'flex', alignItems: 'space-between', width: '100%' }}>
        <div className='sale-order-container'>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Sales</h2>
            <button className={`order-history-icon ${orders.length > 0 ? 'pulsing-icon' : ''}`} onClick={() => setShowOrders(true)}>
              <img width="24" height="24" src="https://img.icons8.com/color/48/order-history.png" alt="order-history" />
            </button>
          </div>

          <div className="categories">
            <button
              className={`category-button ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => handleCategoryClick(null)}
            >
              All Products
            </button>
            {categories?.map(category => (
              <button
                key={category.id}
                className={`category-button ${selectedCategory && selectedCategory.id === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="products">
            {products?.map(product => {
              const cartItem = localCart.find(item => item.id === product.id) || { quantity: 0 };
              const isVisible = selectedCategory === null || selectedCategory.name === product.category;
              return (
                <div key={product.id} className={`product-card ${isVisible ? 'fade-in' : 'fade-out'}`}>
                  <img src={product.imageUrl} alt={product.name} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3>{product.name}</h3>
                    <p style={{ color: 'green' }}>{product.price.toFixed(3)} OMR</p>
                    <div className="incrementer">
                      <button onClick={() => handleQuantityChange(product, cartItem.quantity - 1)} disabled={cartItem.quantity === 0}>-</button>
                      <span>{cartItem.quantity}</span>
                      <button onClick={() => handleQuantityChange(product, cartItem.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showOrders && (
            <div className="orders-modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h2>Orders</h2>
                <button className="close-modal" onClick={() => setShowOrders(false)}>Close</button>
              </div>

              <div className="orders-grid">
                {orders?.map(order => (
                  <div key={order.orderId} className="order-card" onClick={() => handleSelectOrder(order)}>
                    <p>Order ID: {order.orderId}</p>
                    <p>Date: {order.orderDate}</p>
                    <p>Total: {order.total} OMR</p>
                    <button onClick={() => handleSelectOrder(order)}>Open</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="cart" style={{ overflowY: 'scroll' }}>
          <h2>Cart</h2>
          <div className='cart-item-holder'>
            <table className='cart-table'>
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
                {localCart?.map(item => (
                  <tr key={item.id} className="cart-item">
                    <td>{item.name}</td>
                    <td>
                      <div className="incrementer" style={{ gap: '0px' }}>
                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity === 0}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)}>+</button>
                      </div>
                    </td>
                    <td>{item.price.toFixed(3)} OMR</td>
                    <td>{(item.price * item.quantity).toFixed(3)} OMR</td>
                    <td>
                      <button onClick={() => handleRemoveFromCart(item.id)} className='remove'>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-summary">
            <p>Subtotal: {calculateSubtotal().toFixed(3)} OMR</p>
            <p>Discount: <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value))} /></p>
            <p>Total: {calculateTotal().toFixed(3)} OMR</p>
            <div className="payment-section">
              <h3>Make Payment</h3>
              <label>
                Payment Type:
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                  <option value="">Select Payment Type</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </label>
              <button onClick={handleMakePayment}>Make Payment</button>
            </div>
          </div>
        </div>
      </div>

      {showPaymentComplete && (
        <Modal>
          <div className="payment-complete-popup">
            <img src="./images/techny-food-order-complete.png" alt="Transaction Complete" />
            <h2>Transaction Complete</h2>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Sale;
