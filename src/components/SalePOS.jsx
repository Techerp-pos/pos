// SalePOS.jsx
import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import PaymentSection from './PaymentSection';
import SaleHistory from './SaleHistory';
import Select from 'react-select';
import qz from 'qz-tray';
import '../utility/SalePOS.css';
import { useNavigate } from 'react-router-dom';
import { QZTrayContext } from '../contexts/QzTrayContext';
import { Dialog, DialogTitle, DialogContent, TextField, List, ListItem, ListItemText, Button, Box, Autocomplete } from '@mui/material';

function SalePOS() {
    const { currentUser } = useAuth();
    const { isConnected, availablePrinters } = useContext(QZTrayContext);
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
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingShopDetails, setLoadingShopDetails] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scannedValue, setScannedValue] = useState('');
    const Navigate = useNavigate();
    const [openedOrderId, setOpenedOrderId] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false); // For controlling the modal visibility
    const [searchTerm, setSearchTerm] = useState(''); // For the search input
    const openCustomerModal = () => {
        setIsCustomerModalOpen(true);
    };

    const closeCustomerModal = () => {
        setIsCustomerModalOpen(false);
    };

    const handleNewCustomer = () => {
        // Logic to handle adding a new customer
        // You can open a new modal or redirect to a new customer form
        console.log('New customer form opened');
    };

    const handleSelectCustomer = () => {
        if (selectedCustomer) {
            // Logic for selecting a customer and proceeding with that selection
            console.log('Customer selected:', selectedCustomer);
            closeCustomerModal();
        } else {
            alert('Please select a customer before proceeding.');
        }
    };


    const handleOpenOrder = async (sale) => {
        try {
            // Load sale items into the cart
            setCart(sale.items || []);

            // Set the currently opened order ID
            setOpenedOrderId(sale.id);

            // Close the SaleHistory modal
            setShowHistory(false);
        } catch (error) {
            console.error("Failed to load the order: ", error);
            alert("Failed to load the order. Please try again.");
        }
    };

    let config;

    // Fetch customers when the component mounts
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersQuery = query(collection(db, 'customers'), where('shopCode', '==', currentUser.shopCode)); // Assuming 'customers' is the collection name
                const customersSnapshot = await getDocs(customersQuery);
                if (!customersSnapshot.empty) {
                    const customersList = customersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setCustomers(customersList);
                } else {
                    setCustomers([]); // No data found
                }
            } catch (error) {
                console.error("Failed to fetch customers:", error);
                setCustomers([]); // Handle error by setting an empty array
            }
        };

        fetchCustomers();
    }, []);

    // Fetch shop details when the component mounts
    useEffect(() => {
        const fetchShopDetails = async () => {
            setLoadingShopDetails(true);
            try {
                if (currentUser?.shopCode) {
                    const shopDetailsQuery = query(
                        collection(db, 'shopDetails'),
                        where('shopCode', '==', currentUser.shopCode),
                        limit(1)
                    );
                    const querySnapshot = await getDocs(shopDetailsQuery);
                    if (!querySnapshot.empty) {
                        const fetchedShopDetails = querySnapshot.docs[0].data();
                        console.log("Fetched Shop Details:", fetchedShopDetails); // Debugging line
                        setShopDetails(fetchedShopDetails);
                    } else {
                        console.error("No shop details found for shopCode:", currentUser.shopCode);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch shop details:", error);
            } finally {
                setLoadingShopDetails(false);
            }
        };

        fetchShopDetails();
    }, [currentUser?.shopCode]);


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

    const handleDepartmentClick = (department) => {
        setSelectedDepartment(department);
        const departmentItems = items.filter(item => item.category === department.name);
        if (departmentItems.length > 0) {
            setFilteredItems(departmentItems);
        } else {
            setFilteredItems([]); // No items in this department
        }
    };

    const handleItemAdd = (item) => {
        // Ensure we are working with the correct pricing option (like "PCS" or "BOX")
        if (item.pricing && item.pricing.length > 0) {
            const selectedPricingOption = item.pricing.find(p => p.unitType === item.unitType)
                || item.pricing.find(p => p.unitType === 'PCS');
            if (selectedPricingOption) {
                item = {
                    ...item,
                    price: selectedPricingOption.price, // Use the selected pricing option
                    unitType: selectedPricingOption.unitType, // Assign the unit type
                };
            } else {
                alert('Selected unit type not available.');
                return;
            }
        }

        // Since the item already contains the correct pricing, we can directly proceed
        const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.unitType === item.unitType);

        if (existingItem) {
            // If found, increment the quantity for the item
            setCart(cart.map(cartItem =>
                cartItem.id === item.id && cartItem.unitType === item.unitType
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            // If not found, add the item with initial quantity
            setCart([...cart, { ...item, quantity: 1, isReturned: false }]);
        }
    };

    const handleRemoveItem = () => {
        if (selectedItem) {
            setCart(cart.filter(cartItem => !(cartItem.id === selectedItem.id && cartItem.unitType === selectedItem.unitType)));
            setSelectedItem(null);
        }
    };

    const handleReturnItem = () => {
        if (selectedItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === selectedItem.id && cartItem.unitType === selectedItem.unitType
                    ? { ...cartItem, isReturned: !cartItem.isReturned }
                    : cartItem
            ));
            setSelectedItem(null); // Deselect after marking as returned
        } else {
            alert('Please select an item to return.');
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
        if (!isConnected) {
            alert("QZ Tray is not connected. Please ensure it is running.");
            return;
        }

        try {
            let orderNumber;
            if (openedOrderId) {
                // If an existing order is opened, update that order
                const orderRef = doc(db, 'orders', openedOrderId);
                await setDoc(orderRef, {
                    items: cart,
                    total: cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3),
                    paymentMethod: paymentDetails.method,
                    amountPaid: paymentDetails.amountPaid,
                    balance: paymentDetails.balance,
                    customer: selectedCustomer?.name || "Walk In", // Include the selected customer
                    edited: true, // Mark the order as edited
                    timestamp: serverTimestamp(),
                }, { merge: true });

                orderNumber = openedOrderId; // Use the existing order ID
            } else {
                // Generate a new order number if no existing order is opened
                orderNumber = await generateOrderNumber();

                await addDoc(collection(db, 'orders'), {
                    shopCode: currentUser.shopCode,
                    items: cart,
                    total: cart.reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3),
                    paymentMethod: paymentDetails.method,
                    amountPaid: paymentDetails.amountPaid,
                    balance: paymentDetails.balance,
                    customer: selectedCustomer?.name || "Walk In", // Include the selected customer
                    timestamp: serverTimestamp(),
                    cashier: currentUser.uid,
                    orderNumber: orderNumber,
                    status: "completed"
                });
            }

            // Record the returned items separately if necessary
            if (cart.some(cartItem => cartItem.isReturned)) {
                await addDoc(collection(db, 'returns'), {
                    shopCode: currentUser.shopCode,
                    items: cart.filter(cartItem => cartItem.isReturned).map(item => ({
                        id: item.id,
                        name: item.name,
                        unitType: item.unitType,
                        quantity: item.quantity,
                        price: item.price,
                        reason: 'Returned', // Optionally, prompt for a return reason
                        timestamp: serverTimestamp(),
                        orderNumber: orderNumber, // Link to the original order
                        cashier: currentUser.uid,
                    })),
                    timestamp: serverTimestamp(),
                });
            }

            alert('Sale completed successfully!');
            await handlePrintReceipt(orderNumber, paymentDetails);
            setCart([]); // Clear the cart
            setShowPayment(false);
            setOpenedOrderId(null); // Reset the opened order ID after payment is completed
        } catch (error) {
            console.error("Error completing sale: ", error);
            alert("Failed to complete the sale. Please try again.");
        }
    };

    const handlePrintReceipt = async (orderNumber, paymentDetails) => {
        if (!isConnected) {
            alert("QZ Tray is not connected. Please ensure it is running.");
            return;
        }

        if (!shopDetails?.defaultPrinter) {
            alert("Default printer not set. Please select a printer in Settings.");
            Navigate('/settings'); // Redirect to Settings page
            return;
        }

        // Initialize a new configuration using the selected default printer
        const config = qz.configs.create(shopDetails.defaultPrinter);

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
            '------------------------------------------------\n', // Full width separator
            'Sl  Item                    Qty  Price  Amount\n', // Header for items
            '------------------------------------------------\n', // Full width separator
            ...cart.map((item, index) => {
                const price = parseFloat(item?.price || 0);  // Ensure price is a number
                const amount = (price * parseFloat(item.quantity || 0)).toFixed(3); // Calculate amount

                return `${(index + 1).toString().padEnd(3)} ${item.name.padEnd(20)} ${item.quantity.toString().padEnd(4)} ${price.toFixed(3).padEnd(6)} ${amount}\n`;
            }),
            '------------------------------------------------\n', // Full width separator
            `Total ExTax:               ${cart.filter(cartItem => !cartItem.isReturned).reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0).toFixed(3)} OMR\n`,
            `VAT 5%:                    ${(cart.filter(cartItem => !cartItem.isReturned).reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0) * 0.05).toFixed(3)} OMR\n`,
            `Net Total:                 ${(cart.filter(cartItem => !cartItem.isReturned).reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0) * 1.05).toFixed(3)} OMR\n`,
            `Paid:                      ${parseFloat(paymentDetails.amountPaid).toFixed(3)} OMR\n`,
            `Balance:                   ${parseFloat(paymentDetails.balance).toFixed(3)} OMR\n`,
            '------------------------------------------------\n', // Full width separator
            '\x1B\x61\x01', // Center align
            `Transaction Complete!\n`,
            '\x1B\x64\x05', // Feed 5 lines to ensure the print is fully ejected
            '\x1D\x56\x42', // Partial cut
            '\x1B\x64\x10', // Feed extra paper for the next print
        ];

        qz.print(config, data).then(() => {
            console.log("Printed successfully");
        }).catch(err => {
            console.error("Print failed:", err);
            alert("Failed to print the receipt. Please try again.");
        });
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

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ignore if event is coming from an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
                return;
            }

            if (event.key === 'Enter') {
                // Process scannedValue
                if (scannedValue !== '') {
                    let matchingItem = null;
                    let selectedPricingOption = null;

                    // Look for the item by matching barcode inside pricing array
                    items.forEach(item => {
                        item.pricing.forEach(pricing => {
                            if (pricing.barcode === scannedValue) {
                                matchingItem = item; // Store the matched item
                                selectedPricingOption = pricing; // Store the matched pricing option
                            }
                        });
                    });

                    if (matchingItem && selectedPricingOption) {
                        // If item and pricing option are found, add it to cart
                        handleItemAdd({
                            ...matchingItem,
                            price: selectedPricingOption.price,
                            unitType: selectedPricingOption.unitType
                        });
                    } else {
                        alert('Product not found for that barcode');
                    }
                    setScannedValue(''); // Reset the scanned value
                }
            } else {
                // Append key to scannedValue
                setScannedValue(prev => prev + event.key);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [items, scannedValue]);

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
        } else if (value === 'QTY') {
            handleQtyChange();
        } else if (value === 'PRICE') {
            handlePriceChange();
        } else {
            setDisplayValue(prevValue => prevValue + value);
        }

    };

    const handleQtyChange = () => {
        if (selectedItem) {
            const newQuantity = parseInt(displayValue, 10);
            if (!isNaN(newQuantity) && newQuantity > 0) {
                setCart(cart.map(cartItem =>
                    (cartItem.id === selectedItem.id && cartItem.unitType === selectedItem.unitType)
                        ? { ...cartItem, quantity: newQuantity }
                        : cartItem
                ));
                setDisplayValue('');
                setSelectedItem(null); // Deselect item after updating
            } else {
                alert('Please enter a valid quantity.');
            }
        } else {
            alert('Please select an item to change its quantity.');
        }
    };

    const handlePriceChange = () => {
        if (selectedItem) {
            const newPrice = parseFloat(displayValue);
            if (!isNaN(newPrice) && newPrice >= 0) {
                setCart(cart.map(cartItem =>
                    (cartItem.id === selectedItem.id && cartItem.unitType === selectedItem.unitType)
                        ? { ...cartItem, price: newPrice.toFixed(3) }
                        : cartItem
                ));
                setDisplayValue('');
                setSelectedItem(null); // Deselect item after updating
            } else {
                alert('Please enter a valid price.');
            }
        } else {
            alert('Please select an item to change its price.');
        }
    };


    const handleClear = () => {
        setDisplayValue('');
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleClose = () => {
        // window.close(); // Close the window
        Navigate('/pos')
    };

    const handlePaymentButtonClick = () => {
        if (!shopDetails?.defaultPrinter) {
            alert("Default printer not set. Please select a printer in Settings.");
            Navigate('/settings'); // Redirect to Settings page
            return;
        }
        setShowPayment(true);
    };


    return (
        <div className="sale-pos">
            <div className="top-bar">
                <div className="menu-icon">
                    <span>☰</span> {/* Replace with an actual icon if needed */}
                </div>
                <div className="title">Sale</div>
                <div className="date-time">
                    {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
                </div>
                <div className="close-icon" onClick={handleClose}>
                    <span>&times;</span>
                </div>
            </div>

            <div className="content">
                <div className="left-panel">
                    {loadingItems ? (
                        <p>Loading items...</p>
                    ) : (
                        <>
                            <div>
                                <div className="search-container">
                                    <Select
                                        options={filteredItems.flatMap(item =>
                                            item.pricing.map(pricingOption => ({
                                                value: `${item.id}-${pricingOption.unitType}`, // Ensure uniqueness by combining id and unitType
                                                label: (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span>{pricingOption.unitType} ({pricingOption.factor})</span>
                                                        <span>{item.name}</span>
                                                        <span>{parseFloat(pricingOption.cost).toFixed(3)} OMR</span>
                                                    </div>
                                                ),
                                                price: pricingOption.price, // Pass along price for later use
                                                unitType: pricingOption.unitType, // Pass along unit type
                                                name: item.name, // Pass item name as well
                                                itemData: item, // Pass item data to handleItemAdd
                                            }))
                                        )}
                                        onChange={(selectedOption) => {
                                            const selectedItem = items.find(item => item.id === selectedOption.itemData.id);
                                            handleItemAdd({
                                                ...selectedItem,
                                                price: selectedOption.price,
                                                unitType: selectedOption.unitType,
                                            });
                                        }}
                                        placeholder="Search or Scan the product"
                                        isSearchable
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                border: '1px solid #ccc',
                                                boxShadow: 'none',
                                                '&:hover': { border: '1px solid #888' },
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                padding: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }),
                                        }}
                                    />
                                </div>
                                <table className="sales-table">
                                    <thead>
                                        <tr>
                                            <th>SN</th>
                                            <th style={{ width: '150px' }}>Item</th>
                                            <th>UOM</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Disc</th>
                                            <th>Tax</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((cartItem, index) => (
                                            <tr
                                                key={`${cartItem.id}-${cartItem.unitType}`} // Ensure unique key
                                                onClick={() => setSelectedItem(cartItem)}
                                                className={
                                                    selectedItem?.id === cartItem.id &&
                                                        selectedItem.unitType === cartItem.unitType
                                                        ? 'selected-row'
                                                        : ''
                                                }
                                                style={cartItem.isReturned ? { textDecoration: 'line-through', backgroundColor: '#ff505f' } : {}}
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
                            </div>
                            <div className="sales-summary">
                                <p style={{ fontSize: '30px', marginTop: '-10px', textAlign: 'justify' }}>Summary</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p>No. of items: {cart.length}</p> {/* Total number of unique items */}
                                        <p>Total Quantity: {cart.reduce((sum, cartItem) => sum + parseInt(cartItem.quantity || 0, 10), 0)}</p> {/* Total quantity */}
                                    </div>
                                    <div>
                                        <p>Total: {cart
                                            .filter(cartItem => !cartItem.isReturned)
                                            .reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0)
                                            .toFixed(3)} &nbsp;OMR
                                        </p>
                                        {/* 
                                    {cart.some(cartItem => cartItem.isReturned) && (
                                        <p>Returned Items: {cart
                                            .filter(cartItem => cartItem.isReturned)
                                            .reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0)
                                            .toFixed(3)} &nbsp;OMR
                                        </p>
                                    )} */}

                                        <p>Net Total: {cart
                                            .filter(cartItem => !cartItem.isReturned)
                                            .reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0)
                                            .toFixed(3)} &nbsp;OMR
                                        </p>
                                    </div>


                                </div>

                            </div>
                        </>
                    )}
                </div>
                <div style={{ display: 'flex' }}>
                    <div className='department-button'>
                        {loadingDepartments ? (
                            <p>Loading departments...</p>
                        ) : departments.length === 0 ? (
                            <p>No departments available</p>
                        ) : (
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
                        <button onClick={handleReturnItem}>Return</button>
                        <button>Drawer</button>
                        <button>Reprint</button>
                        <button>Hold</button>
                        <button>Unhold</button>
                        <button onClick={handleVoidCart}>Void</button>
                        <button onClick={() => setShowHistory(true)}>History</button>
                        <button>Switch</button>
                        <button onClick={handleRemoveItem}
                            style={{ background: 'red' }}>Remove
                        </button>
                    </div>
                    <button onClick={openCustomerModal} style={{ background: '#ffc816', height: '80px', font: 'Bold' }}>
                        {selectedCustomer ? `Customer(${selectedCustomer.name})` : 'Customer'}
                    </button>
                    <button
                        className="payment-btn"
                        onClick={handlePaymentButtonClick}
                        disabled={cart.filter(cartItem => !cartItem.isReturned).length === 0}
                        title={
                            !shopDetails?.defaultPrinter
                                ? "Default printer not set. Please select a printer in Settings."
                                : ""
                        }
                    >
                        Payment
                    </button>
                    <div className="display-container" >
                        <input
                            type="text"
                            className="keypad-display"
                            value={displayValue}
                            readOnly
                            placeholder="Enter or scan product code"
                            style={{ width: '95%', padding: '10px' }}
                        />
                    </div>
                    <div className="keypad-sale">
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
            {showPayment && !loadingShopDetails ? (
                <PaymentSection
                    total={cart
                        .filter(cartItem => !cartItem.isReturned)
                        .reduce((sum, cartItem) => sum + (parseFloat(cartItem.price || 0) * parseInt(cartItem.quantity || 0, 10)), 0)
                        .toFixed(3)
                    }
                    onClose={() => setShowPayment(false)}
                    onPaymentComplete={handlePayment}
                    shopDetails={shopDetails} // Pass shopDetails as a prop
                />
            ) : showPayment ? (
                <p>Loading shop details...</p>
            ) : null}

            {/* Sale History Section */}
            {showHistory && (
                <SaleHistory
                    onClose={() => setShowHistory(false)}
                    onOpenOrder={handleOpenOrder} // Pass the function here
                />
            )}

            {/* Customer Selection Modal using MUI */}
            <Dialog open={isCustomerModalOpen} onClose={closeCustomerModal} fullWidth maxWidth="sm" >
                <div style={{ margin: '20px' }}>
                    <DialogTitle>Customer Lookup</DialogTitle>
                    <DialogContent>
                        {/* Autocomplete for customer lookup */}
                        <Autocomplete
                            options={customers}
                            getOptionLabel={(customer) => customer.name}
                            value={selectedCustomer}
                            onChange={(event, newValue) => {
                                setSelectedCustomer(newValue); // Set selected customer when selected from dropdown
                            }}
                            inputValue={searchTerm}
                            onInputChange={(event, newInputValue) => {
                                setSearchTerm(newInputValue); // Update the search term when typing
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Customer Lookup"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                />
                            )}
                        />

                        {/* Customer Information Fields */}
                        <TextField
                            label="Name"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={selectedCustomer?.name || ''}
                            InputProps={{
                                readOnly: true,
                            }}
                        />

                        <TextField
                            label="Contact"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={selectedCustomer?.mobile || ''}
                            InputProps={{
                                readOnly: true,
                            }}
                        />

                        <TextField
                            label="Customer Code"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={selectedCustomer?.id || ''}
                            InputProps={{
                                readOnly: true,
                            }}
                        />

                        <Box display="flex" gap={2}>
                            <TextField
                                label="Due Amount"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={selectedCustomer?.dueAmount || ''}
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                            <Button variant="contained" color="primary" style={{ marginTop: '16px', height: '56px' }}>
                                Get Balance
                            </Button>
                        </Box>

                        {/* <Button variant="contained" color="primary" fullWidth style={{ marginTop: '16px' }}>
                        View Report
                    </Button> */}

                        {/* Action Buttons */}
                        <Box display="flex" justifyContent="space-between" marginTop={2}>
                            <Button variant="contained" color="primary" onClick={handleNewCustomer}>
                                New
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleSelectCustomer}>
                                Select
                            </Button>
                        </Box>
                    </DialogContent>
                </div>
            </Dialog>

        </div>
    );

}

export default SalePOS;
