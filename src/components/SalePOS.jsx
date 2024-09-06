import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import PaymentSection from './PaymentSection';
import SaleHistory from './SaleHistory';
import Select from 'react-select';
import qz from 'qz-tray';
import '../utility/SalePOS.css';

function SalePOS() {
    const { currentUser } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [displayValue, setDisplayValue] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [shopDetails, setShopDetails] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingShopDetails, setLoadingShopDetails] = useState(true);
    let config;

    // Fetch shop details when the component mounts
    useEffect(() => {
        const fetchShopDetails = async () => {
            setLoadingShopDetails(true);
            try {
                if (currentUser?.shopCode) {
                    const shopQuery = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
                    const shopSnapshot = await getDocs(shopQuery);
                    if (!shopSnapshot.empty) {
                        setShopDetails(shopSnapshot.docs[0].data());
                    }
                }
            } catch (error) {
                console.error("Failed to fetch shop details:", error);
            } finally {
                setLoadingShopDetails(false);
            }
        };

        fetchShopDetails();
    }, [currentUser.shopCode]);

    // Fetch departments when the component mounts
    useEffect(() => {
        const fetchDepartments = async () => {
            setLoadingDepartments(true);
            try {
                if (currentUser?.shopCode) {
                    const departmentsQuery = query(collection(db, 'categories'), where('shopCode', '==', currentUser.shopCode));
                    const departmentsSnapshot = await getDocs(departmentsQuery);
                    if (!departmentsSnapshot.empty) {
                        setDepartments(departmentsSnapshot.docs.map(doc => doc.data()));
                    } else {
                        setDepartments([]); // No data found
                    }
                }
            } catch (error) {
                console.error("Failed to fetch departments:", error);
                setDepartments([]); // Handle error by setting an empty array
            } finally {
                setLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, [currentUser?.shopCode]);

    // Fetch items when the component mounts
    useEffect(() => {
        const fetchItems = async () => {
            setLoadingItems(true);
            try {
                if (currentUser?.shopCode) {
                    const itemsQuery = query(collection(db, 'products'), where('shopCode', '==', currentUser.shopCode));
                    const itemsSnapshot = await getDocs(itemsQuery);
                    if (!itemsSnapshot.empty) {
                        const itemsList = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setItems(itemsList);
                        setFilteredItems(itemsList);
                    } else {
                        setItems([]); // No data found
                        setFilteredItems([]); // No data found
                    }
                }
            } catch (error) {
                console.error("Failed to fetch items:", error);
                setItems([]); // Handle error by setting an empty array
                setFilteredItems([]); // Handle error by setting an empty array
            } finally {
                setLoadingItems(false);
            }
        };

        fetchItems();
    }, [currentUser?.shopCode]);

    // Manage QZ Tray connection
    const connectToQZTray = async () => {
        if (qz.websocket.isActive()) {
            console.log("QZ Tray connection already exists");
            setIsConnected(true); // Update state to reflect the active connection
            return; // Exit early if already connected
        }

        try {
            setIsConnecting(true);
            await qz.websocket.connect();
            setIsConnected(true);
            console.log("Connected to QZ Tray");
        } catch (err) {
            if (err.message.includes("An open connection with QZ Tray already exists")) {
                console.log("Using existing QZ Tray connection.");
                setIsConnected(true);
            } else {
                console.error("Error connecting to QZ Tray:", err);
                setTimeout(connectToQZTray, 5000); // Retry after 5 seconds if connection fails
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectQZTray = async () => {
        if (qz.websocket.isActive()) {
            try {
                await qz.websocket.disconnect();
                setIsConnected(false);
                console.log("Disconnected from QZ Tray");
            } catch (err) {
                console.error("Error disconnecting from QZ Tray:", err);
            }
        }
    };

    // Connect QZ Tray on component mount
    useEffect(() => {
        connectToQZTray();

        // Clean up the connection when the component unmounts
        return () => {
            disconnectQZTray();
        };
    }, []);

    const handleDepartmentClick = (department) => {
        setSelectedDepartment(department);
        const departmentItems = items.filter(item => item.department === department.name);
        if (departmentItems.length > 0) {
            setFilteredItems(departmentItems);
        } else {
            setFilteredItems([]); // No items in this department
        }
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
        await connectToQZTray(); // Ensure QZ Tray connection is active

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
    const detectPrinters = async () => {
        try {
            const printers = await qz.printers.getList(); // Detect all printers
            console.log("Available Printers:", printers);
            return printers;
        } catch (err) {
            console.error("Error detecting printers:", err);
            return [];
        }
    };

    // Fetch printers and set in the state for user to select
    useEffect(() => {
        const fetchPrinters = async () => {
            const printers = await detectPrinters();
            setAvailablePrinters(printers); // Set printers to state
            setSelectedPrinter(printers[0]); // Auto-select first printer
        };
        fetchPrinters();
    }, []);


    const handlePrintReceipt = async (orderNumber, paymentDetails) => {
        if (!isConnected) {
            await connectToQZTray(); // Ensure the connection is established
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
            '--------------------------------------------------\n', // Full width separator
            `Total ExTax:               ${cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3)} OMR\n`,
            `VAT 5%:                    ${(cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0) * 0.05).toFixed(3)} OMR\n`,
            `Net Total:                 ${(cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0) * 1.05).toFixed(3)} OMR\n`,
            `Paid:                      ${parseFloat(paymentDetails.amountPaid).toFixed(3)} OMR\n`,
            `Balance:                   ${parseFloat(paymentDetails.balance).toFixed(3)} OMR\n`,
            '--------------------------------------------------\n', // Full width separator
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
        if (value === 'Enter') {
            // Check if displayValue matches any product code or name
            const matchingItem = items.find(item =>
                item.code === displayValue ||
                item.name.toLowerCase().includes(displayValue.toLowerCase())
            );
            if (matchingItem) {
                handleItemAdd(matchingItem);
            } else {
                alert('Product not found');
            }
            setDisplayValue(''); // Clear display after processing
        } else {
            setDisplayValue(prevValue => prevValue + value);
        }
    };

    const handleClear = () => {
        setDisplayValue('');
    };

    return (
        <div className="sale-pos">
            <div className="left-panel">
                {loadingItems ? (
                    <p>Loading items...</p>
                ) : (
                    <>
                        <div className="search-container">
                            <Select
                                options={filteredItems.map(item => ({
                                    value: item.id,
                                    label: item.name,
                                }))}
                                onChange={(selectedOption) => {
                                    const selectedItem = items.find(item => item.id === selectedOption.value);
                                    handleItemAdd(selectedItem);
                                }}
                                placeholder="Search or Scan the product"
                                isSearchable
                            />
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
                    </>
                )}
            </div>
            <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: "scroll", width: '200px' }}>
                    {loadingDepartments ? (
                        <p>Loading departments...</p>
                    ) : departments.length === 0 ? (
                        <p>No departments available</p>
                    ) : (
                        <div className="departments" style={{ display: 'flex', flexDirection: 'column', maxWidth: '200px' }}>
                            {departments.map(department => (
                                <button
                                    key={department.name}
                                    onClick={() => handleDepartmentClick(department)}
                                >
                                    {department.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="items">
                    {filteredItems.length === 0 && selectedDepartment ? (
                        <p>No items available in this department</p>
                    ) : filteredItems.map(item => (
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
                <div className="display-container">
                    <input
                        type="text"
                        className="keypad-display"
                        value={displayValue}
                        readOnly
                        placeholder="Enter or scan product code"
                        style={{ width: '90%', padding: '20px' }}
                    />
                </div>
                <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'Enter'].map(key => (
                        <button
                            key={key}
                            onClick={() => handleKeypadClick(key)}
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
