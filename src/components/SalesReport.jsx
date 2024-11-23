import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import {
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Grid,
    CircularProgress,
    Alert,
    Typography,
    Box,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../utility/Report.css';

const SalesReport = () => {
    // Helper functions should be defined at the top
    const getStartOfMonth = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    };

    const getToday = () => {
        return new Date().toISOString().split('T')[0];
    };

    const { currentUser } = useAuth();
    const [shopName, setShopName] = useState('');
    const [departments, setDepartments] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [productMap, setProductMap] = useState({});
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('');
    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getToday());
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(''); // State to store the generated PDF URL

    useEffect(() => {
        fetchShopName();
        fetchDepartments();
        fetchVendors();
        fetchProducts();
    }, []);

    const fetchShopName = async () => {
        try {
            const q = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setShopName(querySnapshot.docs[0].data().name || 'Unknown Shop');
            } else {
                setShopName('Unknown Shop');
            }
        } catch (err) {
            console.error('Error fetching shop name:', err);
            setShopName('Unknown Shop');
        }
    };

    const fetchDepartments = async () => {
        try {
            const q = query(collection(db, 'departments'), where('shopCode', '==', currentUser.shopCode));
            const snapshot = await getDocs(q);
            setDepartments(snapshot.docs.map(doc => doc.data()));
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to fetch departments.');
        }
    };

    const fetchVendors = async () => {
        try {
            const q = query(collection(db, 'vendors'), where('shopCode', '==', currentUser.shopCode));
            const snapshot = await getDocs(q);
            setVendors(snapshot.docs.map(doc => doc.data()));
        } catch (err) {
            console.error('Error fetching vendors:', err);
            setError('Failed to fetch vendors.');
        }
    };

    const fetchProducts = async () => {
        try {
            const q = query(collection(db, 'products'), where('shopCode', '==', currentUser.shopCode));
            const snapshot = await getDocs(q);
            const productsData = snapshot.docs.map(doc => doc.data());
            setProducts(productsData);

            const mapping = {};
            productsData.forEach(product => {
                if (product.name) {
                    mapping[product.name] = product;
                }
            });
            setProductMap(mapping);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to fetch products.');
        }
    };

    const fetchReportData = async () => {
        if (!startDate || !endDate) {
            setError('Please select both start and end dates.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const ordersQuery = query(
                collection(db, 'orders'),
                where('shopCode', '==', currentUser.shopCode),
                where('timestamp', '>=', new Date(startDate)),
                where('timestamp', '<=', new Date(endDate))
            );
            const snapshot = await getDocs(ordersQuery);

            if (snapshot.empty) {
                setError('No orders found for the selected criteria.');
                setReportData([]);
                setPdfUrl(''); // Clear the PDF URL if no data
                setLoading(false);
                return;
            }

            const orders = snapshot.docs.map((doc) => doc.data());
            const filteredOrders = orders.filter(order => {
                // Filter by department
                const departmentMatch = !selectedDepartment || order.items.every(item =>
                    productMap[item.name]?.department === selectedDepartment
                );

                // Filter by vendor
                const vendorMatch = !selectedVendor || order.items.every(item =>
                    productMap[item.name]?.vendor === selectedVendor
                );

                return departmentMatch && vendorMatch;
            });

            const processedData = processReportData(filteredOrders);
            setReportData(processedData);

            // Generate the PDF and set its URL
            generatePdf(processedData);
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (orders) => {
        const reportData = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                // Fetch product details from productMap using the barcode or name
                const productDetails = productMap[item.barcode] || productMap[item.name];
                if (!productDetails) return; // Skip if product details are not found

                // Handle multiple pricing options (e.g., pricing array)
                const pricingData = productDetails.pricing?.find(p => p.barcode === item.barcode) || productDetails.pricing?.[0];
                const cost = parseFloat(pricingData?.cost || 0);
                const price = parseFloat(pricingData?.price || 0);
                const grossProfitPerUnit = price - cost;

                const key = `${item.name}_${productDetails.vendor}_${productDetails.department}`;
                if (!reportData[key]) {
                    reportData[key] = {
                        product: item.name,
                        vendor: productDetails.vendor || 'Unknown',
                        department: productDetails.department || 'Unknown',
                        noInvoices: 0,
                        totalQuantity: 0,
                        totalCost: 0,
                        totalSellingPrice: 0,
                        grossProfit: 0,
                    };
                }

                // Increment data for the report
                reportData[key].noInvoices += 1; // Each order contributes to the number of invoices
                reportData[key].totalQuantity += item.quantity;
                reportData[key].totalCost += cost * item.quantity;
                reportData[key].totalSellingPrice += price * item.quantity;
                reportData[key].grossProfit += grossProfitPerUnit * item.quantity;
            });
        });

        return Object.values(reportData);
    };


    const generatePdf = (data) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(shopName, 10, 10);
        doc.text('Sales Report', 105, 10, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Date Range: ${startDate} to ${endDate}`, 10, 20);

        const tableColumn = ['Product', 'Vendor', 'Department', 'No Invoices', 'Total Quantity', 'Cost', 'Selling Price', 'Gross Profit'];
        const tableRows = data.map(item => [
            item.product,
            item.vendor,
            item.department,
            item.noInvoices,
            item.totalQuantity,
            item.totalCost.toFixed(3),
            item.totalSellingPrice.toFixed(3),
            item.grossProfit.toFixed(3),
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
    };

    return (
        <Box m={3}>
            {error && <Alert severity="error">{error}</Alert>}
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                    <Typography variant="h4" align="center">{shopName}</Typography>
                    <Typography variant="h6" align="center">Sales By Item Report</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            alignItems: 'center',
                            justifyContent: 'space-evenly',
                            backgroundColor: '#f9f9f9',
                            padding: 3,
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {/* Department Selector */}
                        <FormControl sx={{ minWidth: 300 }}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Departments</em>
                                </MenuItem>
                                {departments.map((dept, index) => (
                                    <MenuItem key={index} value={dept.name}>
                                        {dept.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Vendor Selector */}
                        <FormControl sx={{ minWidth: 300 }}>
                            <InputLabel>Vendor</InputLabel>
                            <Select
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Vendors</em>
                                </MenuItem>
                                {vendors.map((vendor, index) => (
                                    <MenuItem key={index} value={vendor.name}>
                                        {vendor.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Start Date Selector */}
                        <TextField
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            sx={{ minWidth: 250 }}
                        />

                        {/* End Date Selector */}
                        <TextField
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            sx={{ minWidth: 250 }}
                        />

                        {/* Generate Report Button */}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={fetchReportData}
                            disabled={loading}
                            sx={{
                                minWidth: 200,
                                padding: '12px 24px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
                        </Button>
                    </Box>
                </Grid>
                {pdfUrl && (
                    <Grid item xs={12} style={{ marginTop: '20px' }}>
                        <Typography variant="h6">Generated Report:</Typography>
                        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                            <embed
                                src={pdfUrl}
                                type="application/pdf"
                                width="100%"
                                height="600px"
                                style={{ border: 'none' }}
                            />
                        </div>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default SalesReport;
