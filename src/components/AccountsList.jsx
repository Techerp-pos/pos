import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import '../utility/Inventory.css'; // Custom styling for spacing, colors

const AccountsList = () => {
    return (
        <div style={{ padding: '20px' }}>
            <Grid container spacing={3}>

                {/* Journal Entries */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card className="inventory-card" style={{ backgroundColor: '#FFB74D', height: '250px', display: 'flex', alignItems: 'center' }}>
                        <CardContent style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                            <img
                                src="https://img.icons8.com/ios-filled/50/ffffff/receipt-dollar.png"
                                alt="Journal Entry Icon"
                                width="48"
                                height="48"
                                style={{ marginRight: '20px' }}
                            />
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom style={{ color: 'white' }}>
                                    Journal Entries
                                </Typography>
                                <Link to='/journal' style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}>
                                    ➡ Manage Journal Records
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>

                </Grid>

                {/* General Payment Voucher */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card className="inventory-card" style={{ backgroundColor: '#66BB6A', height: '250px', display: 'flex', alignItems: 'center' }}>
                        <CardContent style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                            <img
                                src="https://img.icons8.com/ios-glyphs/30/money.png"
                                alt="Payment Voucher Icon"
                                width="48"
                                height="48"
                                style={{ marginRight: '20px' }}
                            />
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom style={{ color: 'white' }}>
                                    General Payment Voucher
                                </Typography>
                                <Link to='/payment' style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}>
                                    ➡ Manage Payments
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Customer Receipt */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card className="inventory-card" style={{ backgroundColor: '#66BB6A', height: '250px', display: 'flex', alignItems: 'center' }}>
                        <CardContent style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                            <img
                                src="https://img.icons8.com/ios-filled/50/ffffff/receipt-dollar.png"
                                alt="Customer Receipt Icon"
                                width="48"
                                height="48"
                                style={{ marginRight: '20px' }}
                            />
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom style={{ color: 'white' }}>
                                    Customer Receipt
                                </Typography>
                                <Link to='/customer-receipt' style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}>
                                    ➡ Customer Transactions
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Vendor Payment */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card className="inventory-card" style={{ backgroundColor: '#66BB6A', height: '250px', display: 'flex', alignItems: 'center' }}>
                        <CardContent style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                            <img
                                src="https://img.icons8.com/ios-filled/50/ffffff/delivery.png"
                                alt="Vendor Payment Icon"
                                width="48"
                                height="48"
                                style={{ marginRight: '20px' }}
                            />
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom style={{ color: 'white' }}>
                                    Vendor Payment
                                </Typography>
                                <Link to='/vendor-payment' style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}>
                                    ➡ Vendor Transactions
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Chart of Accounts */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card className="inventory-card" style={{ backgroundColor: '#29B6F6', height: '250px', display: 'flex', alignItems: 'center' }}>
                        <CardContent style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                            <img
                                src="https://img.icons8.com/ios-filled/50/ffffff/bar-chart.png"
                                alt="Chart of Accounts Icon"
                                width="48"
                                height="48"
                                style={{ marginRight: '20px' }}
                            />
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom style={{ color: 'white' }}>
                                    Chart of Accounts
                                </Typography>
                                <Link to='/charts' style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}>
                                    ➡ Accounts Settings
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Bank Reconciliation */}
                <Grid item xs={12} sm={6} md={4}>
                    <Card className="inventory-card" style={{ backgroundColor: '#FFA726', height: '250px', display: 'flex', alignItems: 'center' }}>
                        <CardContent style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                            <img
                                src="https://img.icons8.com/ios-glyphs/30/cheque.png"
                                alt="Bank Reconciliation Icon"
                                width="48"
                                height="48"
                                style={{ marginRight: '20px' }}
                            />
                            <Box>
                                <Typography variant="h6" component="div" gutterBottom style={{ color: 'white' }}>
                                    Bank Reconciliation
                                </Typography>
                                <Link to='/bank-reconciliation' style={{ textDecoration: 'none', color: 'blue', fontSize: '14px' }}>
                                    ➡ Pending Cheque List
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default AccountsList;
