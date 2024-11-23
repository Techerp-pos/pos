import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import {
    Button, TextField, Grid, Box, CircularProgress, Alert, Typography,
} from '@mui/material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';

const SalesByInvoice = () => {
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
    const [pdfUrl, setPdfUrl] = useState(''); // State for storing PDF URL

    useEffect(() => {
        fetchShopName();
    }, []);

    const fetchShopName = async () => {
        try {
            const q = query(collection(db, 'shops'), where('shopCode', '==', currentUser.shopCode));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const shopDoc = querySnapshot.docs[0];
                setShopName(shopDoc.data().name || 'Unknown Shop');
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
            const q = query(
                collection(db, 'orders'),
                where('shopCode', '==', currentUser.shopCode),
                where('timestamp', '>=', new Date(startDate)),
                where('timestamp', '<=', new Date(endDate))
            );

            const snapshot = await getDocs(q);

            const invoices = snapshot.docs.map(doc => doc.data());
            const processedData = processReportData(invoices);
            setReportData(processedData);

            // Generate PDF and set its URL
            generatePdf(processedData);
        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (invoices) => {
        return invoices.map((invoice, index) => {
            const items = invoice.items || []; // Ensure items is an array
            return {
                sl: index + 1,
                date: invoice.timestamp ? new Date(invoice.timestamp.toDate()).toLocaleDateString() : 'N/A',
                invoiceNumber: invoice.orderNumber || 'N/A',
                customer: invoice.customer || 'Walk In', // Assuming all are walk-ins unless specified
                quantity: items.reduce((acc, item) => acc + (item.quantity || 0), 0), // Handle undefined quantities
                totalCost: items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0),
                tax: items.reduce((acc, item) => acc + ((parseFloat(item.tax || 0) * (item.quantity || 0))), 0),
                total: parseFloat(invoice.total || 0).toFixed(3),
                amountPaid: parseFloat(invoice.amountPaid || 0).toFixed(3),
                balance: parseFloat(invoice.balance || 0).toFixed(3),
                paymentMethod: invoice.paymentMethod || 'N/A',
            };
        });
    };

    const generatePdf = (data) => {
        const doc = new jsPDF();

        // Add title and shop name
        doc.setFontSize(18).setFont('helvetica', 'bold');
        doc.text(`${shopName}`, 10, 10);
        doc.text('SALE BY INVOICE REPORT', 200, 10, { align: 'right' });

        // Add date range
        doc.setFontSize(12).setFont('helvetica', 'normal');
        doc.text(`From: ${startDate}`, 10, 20);
        doc.text(`To: ${endDate}`, 140, 20);

        // Add table content
        const tableColumn = ['Sl', 'Date', 'Invoice Number', 'Customer', 'Quantity', 'Tax', 'Total', 'Amount Paid', 'Balance', 'Payment Method'];
        const tableRows = data.map((item) => [
            item.sl,
            item.date,
            item.invoiceNumber,
            item.customer,
            item.quantity,
            parseFloat(item.tax).toFixed(2),
            item.total,
            item.amountPaid,
            item.balance,
            item.paymentMethod,
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl); // Save PDF URL
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
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                    >
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

export default SalesByInvoice;
