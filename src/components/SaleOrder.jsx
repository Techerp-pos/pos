import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { CartContext } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal'; // Assuming you have a modal component

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
  const [paymentType, setPaymentType] = useState('');
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
    const productSnapshot = await getDocs(productsRef);
    const allProducts = productSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        quantity: 0,
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock, 10)
      };
    });
    const filteredProducts = categoryName
      ? allProducts.filter(product => product.category === categoryName && product.addedBy === currentUser.uid)
      : allProducts.filter(product => product.addedBy === currentUser.uid);
    setProducts(filteredProducts);
  };

  const fetchOrders = async () => {
    if (currentUser) {
      const ordersCollection = collection(db, 'orders');
      const orderSnapshot = await getDocs(ordersCollection);
      let fetchedOrders = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedOrders = fetchedOrders.filter(order => order.addedBy === currentUser.uid && order.status !== 'Completed');

      // Sort orders manually by timestamp
      fetchedOrders.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
      setOrders(fetchedOrders);
    }
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
    if (localCart.length === 0) {
      alert('Please add items to the cart before placing an order.');
      return;
    }

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
      setSelectedOrderId(null); // Reset selected order ID after placing the order
      setLocalCart([]);

      // Fetch the newly placed order and print it
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      handlePrint(orderDoc.data());
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

  const handlePrint = (order) => {
    const printContent = `
      <style>
        body {
          display: flex;
          align-items: center;
          width: 100vw;
          height: 90%;
          flex-direction: column;
        }
        .bill-container {
          font-family: 'Arial', sans-serif;
          width: 95vw;
          border: 1px solid #ccc;
          display: flex;
          flex-direction: column;
          align-items: center;
          // justify-content: space-around;
          gap: 30px;
        }
        .bill-header {
          text-align: center;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          flex-direction: column;
        }
        .bill-header h2 {
          margin: 0;
          font-size: 36px; /* Adjusted font size for receipt paper */
        }
        .bill-header p {
          margin: 0;
          font-size: 28px; /* Adjusted font size for receipt paper */
        }
        .bill-items,
        .transactions {
          width: 100%;
          border-collapse: collapse;
          height: 20%;
        }
        .bill-items th,
        .bill-items td,
        .transactions th,
        .transactions td {
          border: 1px solid #ccc;
          padding: 5px; /* Adjusted padding for better spacing */
          text-align: left;
          font-size: 30px; /* Adjusted font size for receipt paper */
        }
        .bill-summary {
          height: 20%;
          width: 100%;
          text-align: right;
          font-size: 30px; /* Adjusted font size for receipt paper */
        }
        .bill-footer {
          text-align: center;
          font-size: 30px; /* Adjusted font size for receipt paper */
        }
      </style>
      <div>
      <div class="bill-container">
        <div class="bill-header">
          ${shopDetails.logoUrl ? `<img src="${shopDetails.logoUrl}" alt="Logo" style="width: 150px;height: 150px;border-radius: 20px;margin-bottom: 30px;"` : ''}
          <div>
          <h2 style="font-size: 36px">${shopDetails.name}</h2>
          <p>${shopDetails.address}</p>
          <p>${shopDetails.phone}</p>
          <p>Order Bill</p>
          <p>${new Date().toLocaleDateString()} &nbsp; &nbsp;${new Date().toLocaleTimeString()}</p>
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
        </div>
        </div>
        
      </div>
      </div>
    `;
    const printWindow = window.open('', '');
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
                <div key={product.id} className={`product-card ${isVisible ? 'fade-in' : 'fade-out'}`} onClick={() => handleQuantityChange(product, cartItem.quantity + 1)}>
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3>{product.name}</h3>
                    <p style={{ color: 'green' }}>{product.price.toFixed(3)} OMR</p>
                    {/* <span>{cartItem.quantity}</span> */}
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
                    <p>Time: {new Date(order.timestamp.toDate()).toLocaleTimeString()}</p>
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
