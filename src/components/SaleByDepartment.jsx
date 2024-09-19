import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import {
    Button, Select, MenuItem, FormControl, InputLabel, TextField, Grid, Table, TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Typography, Paper
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

    useEffect(() => {
        fetchShopName();
        fetchDepartments();
    }, []);



    // Fetch shop name
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

    // Fetch departments
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
            let q = query(
                collection(db, 'orders'),
                where('timestamp', '>=', new Date(startDate)),
                where('timestamp', '<=', new Date(endDate))
            );

            if (selectedDepartment) {
                q = query(q, where('department', '==', selectedDepartment));
            }

            const snapshot = await getDocs(q);

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

            const data = processReportDataByDepartment(orders);
            setReportData(data);
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

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales By Department');
        XLSX.writeFile(workbook, 'SalesByDepartment.xlsx');
    };

    const exportToPdf = () => {
        const doc = new jsPDF();

        // Set font and styles for the header
        doc.setFontSize(18); // Set font size
        doc.setTextColor(40, 44, 99); // Set text color (RGB)
        doc.setFont('helvetica', 'bold'); // Set font family and style

        // Add shop name and title
        // Add shop name on the left and report title on the right
        doc.text(`${shopName}`, 10, 10); // Shop name on the left
        doc.text('SALE BY DEPARTMENT REPORT', 200, 10, { align: 'right' }); // Report title on the right

        // Add date range with different style
        doc.setFontSize(12); // Smaller font for the date range
        doc.setFont('helvetica', 'normal'); // Regular style
        doc.text(`From: ${startDate}`, 10, 20);
        doc.text(`To: ${endDate}`, 140, 20);

        // Table styles and content
        const tableColumn = ['Department', 'Total Quantity', 'Total Cost', 'Selling Price', 'Gross Profit'];
        const tableRows = reportData.map((item) => [
            item.department,
            item.totalQuantity,
            item.totalCost.toFixed(2),
            item.totalSellingPrice.toFixed(2),
            item.grossProfit.toFixed(2),
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30, // Adjust to avoid overlapping the header text
            headStyles: {
                fillColor: [22, 160, 133], // Custom header background color
                textColor: 255, // White text for the header
                fontSize: 10,
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 3,
            },
        });

        // Save the PDF
        doc.save('SalesByDepartment.pdf');
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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControl style={{ minWidth: 350 }}>
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
                            style={{ minWidth: 200 }}
                        />

                        <TextField
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ minWidth: 200 }}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={fetchReportData}
                            disabled={loading}
                            style={{ minWidth: 200 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
                        </Button>
                    </div>
                </Grid>

                {reportData.length > 0 && (
                    <>
                        <Grid item xs={12}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <Button variant="contained" color="secondary" onClick={exportToPdf}>
                                    Download PDF
                                </Button>
                                <Button variant="contained" color="success" onClick={exportToExcel}>
                                    Download Excel
                                </Button>
                            </div>
                        </Grid>

                        <Grid item xs={12}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Department</TableCell>
                                        <TableCell>Total Quantity</TableCell>
                                        <TableCell>Total Cost</TableCell>
                                        <TableCell>Selling Price</TableCell>
                                        <TableCell>Gross Profit</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.department}</TableCell>
                                            <TableCell>{item.totalQuantity}</TableCell>
                                            <TableCell>{item.totalCost.toFixed(2)}</TableCell>
                                            <TableCell>{item.totalSellingPrice.toFixed(2)}</TableCell>
                                            <TableCell>{item.grossProfit.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
};

export default SaleByDepartment;
