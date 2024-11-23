import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import {
    Button, Select, MenuItem, FormControl, InputLabel, TextField, Grid, Table, TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Typography,
} from '@mui/material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';

const SaleByDepartment = () => {
    const { currentUser } = useAuth();

    const getStartOfMonth = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    };

    const getToday = () => {
        return new Date().toISOString().split('T')[0];
    };

    const [shopName, setShopName] = useState('');
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getToday());
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(''); // State to hold the generated PDF URL

    useEffect(() => {
        fetchShopName();
        fetchDepartments();
    }, []);

    const fetchShopName = async () => {
        try {
            const q = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const shopDoc = querySnapshot.docs[0];
                setShopName(shopDoc.data().name);
            } else {
                setShopName('Unknown Shop');
            }
        } catch (err) {
            console.error("Error fetching shop name:", err);
            setShopName('Unknown Shop');
        }
    };

    const fetchDepartments = async () => {
        try {
            const q = query(collection(db, 'departments'));
            const snapshot = await getDocs(q);
            setDepartments(snapshot.docs.map(doc => doc.data()));
        } catch (err) {
            console.error("Error fetching departments:", err);
            setError("Failed to fetch departments.");
        }
    };

    const fetchReportData = async () => {
        if (!startDate || !endDate) {
            setError("Please select both start and end dates.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch all orders within the date range
            const q = query(
                collection(db, 'orders'),
                where('timestamp', '>=', new Date(startDate)),
                where('timestamp', '<=', new Date(endDate))
            );

            const snapshot = await getDocs(q);

            // Map the orders
            const orders = snapshot.docs.map(doc => {
                const orderData = doc.data();
                const items = Array.isArray(orderData.items) ? orderData.items : [];
                return {
                    ...orderData,
                    items: items.map(item => ({
                        ...item,
                        pricing: Array.isArray(item.pricing) ? item.pricing : []
                    }))
                };
            });

            // Filter items within each order based on the selected department
            const filteredOrders = orders.map(order => ({
                ...order,
                items: order.items.filter(item =>
                    !selectedDepartment || item.department === selectedDepartment
                )
            }))
                // Remove orders that have no matching items
                .filter(order => order.items.length > 0);

            const data = processReportDataByDepartment(filteredOrders);
            setReportData(data);

            // Generate and display the PDF
            generatePdf(data);
        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };



    const processReportDataByDepartment = (ordersWithDetails) => {
        const reportData = {};
        ordersWithDetails.forEach(order => {
            order.items.forEach(item => {
                const department = item.department || "Unknown";
                const cost = parseFloat(item.pricing[0]?.cost || 0);
                const price = parseFloat(item.pricing[0]?.price || 0);
                const grossProfit = price - cost;

                if (!reportData[department]) {
                    reportData[department] = {
                        department: department,
                        totalQuantity: 0,
                        totalCost: 0,
                        totalSellingPrice: 0,
                        grossProfit: 0,
                    };
                }

                reportData[department].totalQuantity += item.quantity;
                reportData[department].totalCost += cost * item.quantity;
                reportData[department].totalSellingPrice += price * item.quantity;
                reportData[department].grossProfit += grossProfit * item.quantity;
            });
        });

        return Object.values(reportData);
    };

    const generatePdf = (data) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(shopName, 10, 10);
        doc.text('SALE BY DEPARTMENT REPORT', 105, 10, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Date Range: ${startDate} to ${endDate}`, 10, 20);

        const tableColumn = ['Department', 'Total Quantity', 'Total Cost', 'Selling Price', 'Gross Profit'];
        const tableRows = data.map((item) => [
            item.department,
            item.totalQuantity,
            item.totalCost.toFixed(2),
            item.totalSellingPrice.toFixed(2),
            item.grossProfit.toFixed(2),
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
    };

    return (
        <Box m={3}>
            {error && (
                <Alert severity="error">{error}</Alert>
            )}
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                    <Typography variant="h4" align="center">{shopName}</Typography>
                    <Typography variant="h6" align="center">Sales By Department Report</Typography>
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
                                    <MenuItem key={index} value={dept.name}>{dept.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            sx={{ minWidth: 250 }}
                        />

                        <TextField
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            sx={{ minWidth: 250 }}
                        />

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

export default SaleByDepartment;
