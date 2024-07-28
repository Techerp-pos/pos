import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function SaleOrder() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [shopDetails, setShopDetails] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [localCart, setLocalCart] = useState([]);
  const [status, setStatus] = useState('Pending');
  const { currentUser } = useAuth();

  const { cart, dispatch } = useContext(CartContext);

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

    const fetchOrders = async () => {
      if (currentUser) {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const ordersCollection = collection(db, 'orders');
        const q = query(ordersCollection, where('addedBy', '==', currentUser.uid), where('orderDate', '==', today));
        const orderSnapshot = await getDocs(q);
        setOrders(orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };

    fetchCategories();
    fetchShopDetails();
    fetchProducts();
    loadCartFromLocalStorage();
    fetchOrders();
  }, [currentUser]);

  useEffect(() => {
    if (!selectedOrderId) {
      setLocalCart(cart);
    }
  }, [cart, selectedOrderId]);

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

  const loadCartFromLocalStorage = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    dispatch({ type: 'SET_CART', payload: savedCart });
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

  const generateOrderId = async () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const orderCounterDocRef = doc(db, 'orderCounters', formattedDate);

    const orderCounterDoc = await getDoc(orderCounterDocRef);

    let increment = 1;
    if (orderCounterDoc.exists()) {
      increment = orderCounterDoc.data().currentIncrement + 1;
    }

    await setDoc(orderCounterDocRef, { currentIncrement: increment });

    return `${formattedDate}${String(increment).padStart(4, '0')}`; // Format: YYYYMMDD0001
  };

  const handlePlaceOrder = async () => {
    const orderId = selectedOrderId || await generateOrderId();

    try {
      await setDoc(doc(db, 'orders', orderId), {
        orderId,
        orderDate: new Date().toISOString().split('T')[0],
        cart: localCart,
        subtotal: calculateSubtotal().toFixed(3),
        discount,
        total: calculateTotal().toFixed(3),
        timestamp: new Date(),
        addedBy: currentUser.uid,
        status: status
      });
      alert('Order placed successfully');
      dispatch({ type: 'CLEAR_CART' });
      localStorage.removeItem('cart');
      handlePrint(orderId);
      setSelectedOrderId(null); // Reset selected order ID after placing the order
      fetchOrders(); // Refresh orders after placing a new order
      setLocalCart([]);
    } catch (error) {
      console.error('Error placing order: ', error);
      alert('Failed to place order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      alert('Order deleted successfully');
      fetchOrders(); // Refresh orders after deletion
    } catch (error) {
      console.error('Error deleting order: ', error);
      alert('Failed to delete order');
    }
  };

  const handlePrint = (orderId) => {
    const order = orders.find(order => order.orderId === orderId) || {};
    const printContent = `
      <style>
        .bill-container {
          font-family: 'Arial', sans-serif;
          width: 80mm;
          padding: 10px;
          border: 1px solid #ccc;
          margin: auto;
        }
        .bill-header {
          text-align: center;
          margin-bottom: 10px;
        }
        .bill-header h2, .bill-header p {
          margin: 0;
        }
        .bill-items, .transactions {
          width: 100%;
          border-collapse: collapse;
        }
        .bill-items th, .bill-items td, .transactions th, .transactions td {
          border: 1px solid #ccc;
          padding: 5px;
          text-align: left;
        }
        .bill-summary {
          margin-top: 10px;
          width: 100%;
          text-align: right;
        }
        .bill-footer {
          margin-top: 10px;
          text-align: center;
        }
      </style>
      <div class="bill-container">
        <div class="bill-header">
          ${shopDetails.logoUrl ? `<img src="${shopDetails.logoUrl}" alt="Logo" style="width: 50px; height: 50px;"/>` : ''}
          <p>${shopDetails.name}</p>
          <p>${shopDetails.address}</p>
          <p>${shopDetails.phone}</p>
          <h2>eSale-POS</h2>
          <p>Invoice</p>
          <p>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>
        <table class="bill-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.cart?.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(3)}</td>
                <td>${(item.price * item.quantity).toFixed(3)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="bill-summary">
          <p>Total: ${order.total} OMR</p>
        </div>
        <div class="transactions">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Given</th>
              <th>Balance</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CASH</td>
              <td>5.000</td>
              <td>3.800</td>
              <td>${order.total} OMR</td>
            </tr>
          </tbody>
        </div>
        <div class="bill-footer">
          <p>Signature:</p>
          <p>No CASH REFUND</p>
          <p>NO EXCHANGE</p>
        </div>
      </div>
    `;
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEditOrder = async (orderId) => {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
      const orderData = orderDoc.data();
      dispatch({ type: 'CLEAR_CART' });
      localStorage.removeItem('cart');
      setLocalCart(orderData.cart);
      localStorage.setItem('cart', JSON.stringify(orderData.cart));
      setSelectedOrderId(orderId);
    } else {
      alert('Order not found');
    }
  };

  return (
    <div className="sale-order">
      <div style={{ display: 'flex', alignItems: 'space-between', width: '100%' }}>
        <div className='sale-order-container'>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Sale Order</h2>
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
                  <div key={order.orderId} className="order-card">
                    <p>Order ID: {order.orderId}</p>
                    <p>Date: {order.orderDate}</p>
                    <p>Total: {order.total} OMR</p>
                    <button onClick={() => handleEditOrder(order.orderId)}>Edit</button>
                    <button onClick={() => handleDeleteOrder(order.orderId)} className="delete-button">Delete</button>
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
            <button onClick={handlePlaceOrder}>Place Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaleOrder;
