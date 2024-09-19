import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import {
    Button, TextField, Grid, Table, TableHead, TableRow, TableCell, TableBody, Box, CircularProgress, Alert, Typography
} from '@mui/material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';

const SalesByInvoice = () => {
    // Get the first day of the current month and today's date
    const getStartOfMonth = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    };
    const getToday = () => {
        return new Date().toISOString().split('T')[0];
    };

    const { currentUser } = useAuth();
    const [shopName, setShopName] = useState('');
    const [startDate, setStartDate] = useState(getStartOfMonth());
    const [endDate, setEndDate] = useState(getToday());
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchShopName();
        fetchReportData(); // Fetch report data on mount
    }, []);

    // Fetch shop name from shopCode
    const fetchShopName = async () => {
        try {
            const q = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const shopDoc = querySnapshot.docs[0];
                setShopName(shopDoc.data().name); // Assuming 'name' is the field that stores the shop's name
            } else {
                setShopName('Unknown Shop');
            }
        } catch (err) {
            console.error("Error fetching shop name:", err);
            setShopName('Unknown Shop');
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

            const snapshot = await getDocs(q);

            const invoices = snapshot.docs.map(doc => doc.data());
            setReportData(processReportData(invoices));
        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (invoices) => {
        const reportData = invoices.map((invoice, index) => ({
            sl: index + 1,
            date: new Date(invoice.timestamp.toDate()).toLocaleDateString(),
            invoiceNumber: invoice.orderNumber || 'N/A',
            customer: 'Walk In',  // Assuming all are walk-ins unless specified
            quantity: invoice.items.reduce((acc, item) => acc + item.quantity, 0),  // Sum of all item quantities
            totalCost: invoice.items.reduce((acc, item) => acc + (item.cost * item.quantity), 0),
            margin: invoice.items.reduce((acc, item) => acc + (parseFloat(item.margin) * item.quantity), 0),
            tax: invoice.items.reduce((acc, item) => acc + (parseFloat(item.vat) * item.quantity), 0),
            total: invoice.total || 0,
            amountPaid: invoice.amountPaid || 0,
            balance: invoice.balance || 0,
            paymentMethod: invoice.paymentMethod || 'N/A'
        }));

        return reportData;
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales By Invoice');
        XLSX.writeFile(workbook, 'SalesByInvoice.xlsx');
    };

    const exportToPdf = () => {
        const doc = new jsPDF();

        // Add shop name on the left and report title on the right
        doc.setFontSize(18).setFont('helvetica', 'bold');
        doc.text(`${shopName}`, 10, 10);
        doc.text('SALE BY INVOICE REPORT', 200, 10, { align: 'right' });

        // Add date range
        doc.setFontSize(12).setFont('helvetica', 'normal');
        doc.text(`From: ${startDate}`, 10, 20);
        doc.text(`To: ${endDate}`, 140, 20);

        const tableColumn = ['Sl', 'Date', 'Invoice Number', 'Customer', 'Quantity', 'Total Cost', 'Margin', 'Tax', 'Total', 'Amount Paid', 'Balance', 'Payment Method'];
        const tableRows = reportData.map((item) => [
            item.sl,
            item.date,
            item.invoiceNumber,
            item.customer,
            item.quantity,
            item.totalCost.toFixed(2),
            item.margin.toFixed(2),
            item.tax.toFixed(2),
            parseFloat(item.total || 0).toFixed(2),  // Ensure total is a number
            parseFloat(item.amountPaid || 0).toFixed(2),  // Ensure amountPaid is a number
            parseFloat(item.balance || 0).toFixed(2),  // Ensure balance is a number
            item.paymentMethod,
        ]);


        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            headStyles: {
                fillColor: [22, 160, 133],
                textColor: 255,
                fontSize: 10,
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 3,
            },
        });

        doc.save('SalesByInvoice.pdf');
    };

    return (
        <Box m={3}>
            {error && <Alert severity="error">{error}</Alert>}
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                    <Typography variant="h4" align="center">{shopName}</Typography>
                    <Typography variant="h6" align="center">Sales By Invoice Report</Typography>
                </Grid>
                <Grid item xs={12}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                                        <TableCell>Sl</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Invoice Number</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Total Cost</TableCell>
                                        <TableCell>Margin</TableCell>
                                        <TableCell>Tax</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Amount Paid</TableCell>
                                        <TableCell>Balance</TableCell>
                                        <TableCell>Payment Method</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.sl}</TableCell>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell>{item.invoiceNumber}</TableCell>
                                            <TableCell>{item.customer}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{parseFloat(item.totalCost || 0).toFixed(3)}</TableCell>  {/* Ensuring totalCost is a number */}
                                            <TableCell>{parseFloat(item.margin || 0).toFixed(3)}</TableCell>  {/* Ensuring margin is a number */}
                                            <TableCell>{parseFloat(item.tax || 0).toFixed(3)}</TableCell>  {/* Ensuring tax is a number */}
                                            <TableCell>{parseFloat(item.total || 0).toFixed(3)}</TableCell>  {/* Ensuring total is a number */}
                                            <TableCell>{parseFloat(item.amountPaid || 0).toFixed(3)}</TableCell>  {/* Ensuring amountPaid is a number */}
                                            <TableCell>{parseFloat(item.balance || 0).toFixed(3)}</TableCell>  {/* Ensuring balance is a number */}
                                            <TableCell>{item.paymentMethod}</TableCell>
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

export default SalesByInvoice;
