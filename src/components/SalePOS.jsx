import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import PaymentSection from './PaymentSection';
import SaleHistory from './SaleHistory';
import qz from 'qz-tray';
import '../utility/SalePOS.css';

function SalePOS() {
    const { currentUser } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [displayValue, setDisplayValue] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [shopDetails, setShopDetails] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    let config;

    // Fetch shop details when the component mounts
    useEffect(() => {
        const fetchShopDetails = async () => {
            if (currentUser?.shopCode) {
                const shopQuery = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
                const shopSnapshot = await getDocs(shopQuery);
                if (!shopSnapshot.empty) {
                    setShopDetails(shopSnapshot.docs[0].data());
                }
            }
        };

        fetchShopDetails();
    }, [currentUser.shopCode]);

    // Fetch departments when the component mounts
    useEffect(() => {
        const fetchDepartments = async () => {
            const departmentsSnapshot = await getDocs(collection(db, 'departments'));
            setDepartments(departmentsSnapshot.docs.map(doc => doc.data()));
        };

        fetchDepartments();
    }, []);

    // Fetch items when the component mounts
    useEffect(() => {
        const fetchItems = async () => {
            const itemsSnapshot = await getDocs(collection(db, 'products'));
            const itemsList = itemsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.shopCode === currentUser.shopCode);
            setItems(itemsList);
            setFilteredItems(itemsList);
        };

        fetchItems();
    }, [currentUser.shopCode]);

    // Ensure QZ Tray connection is established when the component mounts
    useEffect(() => {
        const connectToQZTray = async () => {
            if (isConnected || isConnecting) return; // Prevent multiple connections

            try {
                setIsConnecting(true);
                await qz.websocket.connect();
                setIsConnected(true);
                console.log("Connected to QZ Tray");
            } catch (err) {
                console.error("Error connecting to QZ Tray:", err);
            } finally {
                setIsConnecting(false);
            }
        };

        connectToQZTray();

        // Clean up the connection when the component unmounts
        return () => {
            if (isConnected) {
                qz.websocket.disconnect().then(() => {
                    setIsConnected(false);
                    console.log("Disconnected from QZ Tray");
                }).catch(err => console.error("Error disconnecting from QZ Tray:", err));
            }
        };
    }, [isConnected, isConnecting]);

    const handleDepartmentClick = (department) => {
        setSelectedDepartment(department);
        const departmentItems = items.filter(item => item.department === department.name);
        setFilteredItems(departmentItems);
    };

    const handleSearch = (e) => {
        const searchQuery = e.target.value.toLowerCase();
        setSearchTerm(searchQuery);
        const searchedItems = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery) ||
            item.localName.toLowerCase().includes(searchQuery) ||
            item.barcode.includes(searchQuery)
        );
        setFilteredItems(searchedItems);
    };

    const handleItemAdd = (item) => {
        if (item.pricing && item.pricing.length > 0) {
            const pcsItem = item.pricing.find(p => p.unitType === 'PCS');
            if (pcsItem) {
                item = {
                    ...item,
                    ...pcsItem,
                };
            } else {
                return;
            }
        }

        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const handleRemoveItem = () => {
        if (selectedItem) {
            setCart(cart.filter(cartItem => cartItem.id !== selectedItem.id));
            setSelectedItem(null);
        }
    };

    const generateOrderNumber = async () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0].replace(/-/g, '');

        const ordersRef = collection(db, 'orders');
        const todayQuery = query(
            ordersRef,
            where('shopCode', '==', currentUser.shopCode),
            where('orderNumber', '>=', `${dateString}0000`),
            where('orderNumber', '<=', `${dateString}9999`),
            orderBy('orderNumber', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(todayQuery);

        if (!snapshot.empty) {
            const lastOrderNumber = snapshot.docs[0].data().orderNumber;
            const lastIncrement = parseInt(lastOrderNumber.slice(-4), 10);
            const newIncrement = (lastIncrement + 1).toString().padStart(4, '0');
            return `${dateString}${newIncrement}`;
        } else {
            return `${dateString}0001`;
        }
    };

    const handlePayment = async (paymentDetails) => {
        try {
            const orderNumber = await generateOrderNumber();

            await addDoc(collection(db, 'orders'), {
                shopCode: currentUser.shopCode,
                items: cart,
                total: cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3),
                paymentMethod: paymentDetails.method,
                amountPaid: paymentDetails.amountPaid,
                balance: paymentDetails.balance,
                timestamp: serverTimestamp(),
                cashier: currentUser.uid,
                orderNumber: orderNumber,
                status: "completed"
            });

            alert('Sale completed successfully!');
            await handlePrintReceipt(orderNumber, paymentDetails);
            setCart([]);
            setShowPayment(false);
        } catch (error) {
            console.error("Error completing sale: ", error);
            alert("Failed to complete the sale. Please try again.");
        }
    };

    const handlePrintReceipt = async (orderNumber, paymentDetails) => {
        if (!isConnected) {
            try {
                await qz.websocket.connect(); // Ensure the connection is established
                setIsConnected(true);
            } catch (err) {
                console.error("Failed to connect to QZ Tray:", err);
                return;
            }
        }

        // Initialize a new configuration for each print
        config = qz.configs.create("RONGTA 80mm Series Printer"); // Ensure this matches your printer's name

        const data = [
            '\x1B\x40', // Initialize printer
            '\x1B\x61\x01', // Center align
            '\x1D\x21\x11', // Double height & width for the shop name
            `${shopDetails?.name || 'SHOP NAME'}\n`, // Shop name
            '\x1D\x21\x00', // Normal text
            `${shopDetails?.address || 'SHOP ADDRESS'}\n`,
            `${shopDetails?.phone ? `MOB: ${shopDetails.phone}` : ''}\n`,
            '----------------------------------------\n', // Full width separator for 80mm
            '\x1B\x61\x00', // Left align
            `Invoice No: ${orderNumber}\n`,
            `Terminal: ${'Terminal 1'}\n`, // Assuming fixed terminal for now
            `Date: ${new Date().toLocaleDateString()}\n`,
            `Time: ${new Date().toLocaleTimeString()}\n`,
            `Served By: ${currentUser.displayName || 'admin'}\n`,
            `Customer: Walk In\n`, // Assuming Walk In customer for now
            '--------------------------------------------------\n', // Full width separator
            'Sl  Item                    Qty  Price  Amount\n', // Header for items
            '--------------------------------------------------\n', // Full width separator
            ...cart.map((item, index) => {
                const price = parseFloat(item?.price || 0);  // Ensure price is a number
                const amount = (price * parseFloat(item.quantity || 0)).toFixed(3); // Calculate amount

                return `${(index + 1).toString().padEnd(3)} ${item.name.padEnd(20)} ${item.quantity.toString().padEnd(4)} ${price.toFixed(3).padEnd(6)} ${amount}\n`;
            }),
            '----------------------------------------\n', // Full width separator
            `Total ExTax:               ${cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3)} OMR\n`,
            `VAT 5%:                    ${(cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0) * 0.05).toFixed(3)} OMR\n`,
            `Net Total:                 ${(cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0) * 1.05).toFixed(3)} OMR\n`,
            `Paid:                      ${parseFloat(paymentDetails.amountPaid).toFixed(3)} OMR\n`,
            `Balance:                   ${parseFloat(paymentDetails.balance).toFixed(3)} OMR\n`,
            '----------------------------------------\n', // Full width separator
            '\x1B\x61\x01', // Center align
            `Transaction Complete!\n`,
            '\x1B\x64\x05', // Feed 5 lines to ensure the print is fully ejected
            '\x1D\x56\x42', // Partial cut
            '\x1B\x64\x10', // Feed extra paper for the next print
        ];

        qz.print(config, data).then(() => {
            console.log("Printed successfully");
        }).catch(err => console.error("Print failed:", err));
    };


    const handleVoidCart = () => {
        setShowPopup(true);
    };

    const confirmVoid = () => {
        setCart([]);
        setShowPopup(false);
    };

    const cancelVoid = () => {
        setShowPopup(false);
    };

    const handleKeypadClick = (value) => {
        if (selectedItem) {
            const newCart = cart.map(cartItem => {
                if (cartItem.id === selectedItem.id) {
                    if (value === 'QTY') {
                        cartItem.quantity = parseFloat(displayValue);
                    } else if (value === 'PRICE') {
                        cartItem.price = parseFloat(displayValue);
                    }
                }
                return cartItem;
            });
            setCart(newCart);
            setDisplayValue('');
        }
    };

    const handleClear = () => {
        setDisplayValue('');
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            // Navigate down the list
        } else if (e.key === 'ArrowUp') {
            // Navigate up the list
        }
    };

    return (
        <div className="sale-pos">
            <div className="left-panel">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search or Scan the product"
                        value={searchTerm}
                        onChange={handleSearch}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {searchTerm && (
                        <div className="search-dropdown">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className="search-item"
                                    onClick={() => handleItemAdd(item)}
                                >
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>Item</th>
                            <th>UOM</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Disc</th>
                            <th>Tax</th>
                            <th>Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map((cartItem, index) => (
                            <tr
                                key={cartItem.id}
                                onClick={() => setSelectedItem(cartItem)}
                                className={selectedItem?.id === cartItem.id ? 'selected-row' : ''}
                            >
                                <td>{index + 1}</td>
                                <td>{cartItem.name}</td>
                                <td>{cartItem.unitType}</td>
                                <td>{cartItem.quantity}</td>
                                <td>{parseFloat(cartItem.price || 0).toFixed(3)}</td>
                                <td>{parseFloat(cartItem.discount || 0).toFixed(3)}</td>
                                <td>{cartItem.taxType}</td>
                                <td>{(parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)).toFixed(3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="sales-summary">
                    <p>Total: {cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3)}</p>
                </div>
            </div>
            <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: "scroll", height: "95vh", width: '100px' }}>
                    <div className="departments">
                        {departments.map(department => (
                            <button
                                key={department.name}
                                onClick={() => handleDepartmentClick(department)}
                            >
                                {department.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="items">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            className="product-card-sale"
                            onClick={() => handleItemAdd(item)}
                        >
                            <p>{item.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="right-panel">
                <div className="action-buttons">
                    <button>Return</button>
                    <button>Drawer</button>
                    <button>Reprint</button>
                    <button>Hold</button>
                    <button>Unhold</button>
                    <button onClick={handleVoidCart}>Void</button>
                    <button onClick={() => setShowHistory(true)}>History</button>
                    <button>Switch</button>
                    <button>Customer</button>
                </div>
                <button className="remove" onClick={handleRemoveItem}>Remove</button>
                <button className="payment-btn" onClick={() => setShowPayment(true)}>Payment</button>
                <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'Enter'].map(key => (
                        <button
                            key={key}
                            onClick={() => setDisplayValue(displayValue + key)}
                        >
                            {key}
                        </button>
                    ))}
                    <button onClick={() => handleKeypadClick('QTY')} style={{ background: 'blue' }}>QTY</button>
                    <button onClick={() => handleKeypadClick('PRICE')} style={{ background: 'orange' }}>PRICE</button>
                    <button onClick={handleClear} style={{ background: 'red' }}>Clear</button>
                </div>
            </div>

            {/* Popup for Void Confirmation */}
            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <p>Are you sure you want to void the cart?</p>
                        <button onClick={confirmVoid}>Yes</button>
                        <button onClick={cancelVoid}>No</button>
                    </div>
                </div>
            )}

            {/* Payment Section */}
            {showPayment && (
                <PaymentSection
                    total={cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3)}
                    onClose={() => setShowPayment(false)}
                    onPaymentComplete={handlePayment}
                />
            )}

            {/* Sale History Section */}
            {showHistory && (
                <SaleHistory
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
}

export default SalePOS;