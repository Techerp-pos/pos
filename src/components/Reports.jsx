import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import SalesReport from './SalesReport'; // Assuming these components are in separate files
import SaleByDepartment from './SaleByDepartment';
import SalesByInvoice from './SalesByInvoice';

const Reports = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return <SalesReport />;
            case 1:
                return <SaleByDepartment />;
            case 2:
                return <SalesByInvoice />;
            default:
                return null;
        }
    };

    return (
        <Box m={3}>
            {/* <Typography variant="h4" align="center" gutterBottom>
                Sales Reports
            </Typography> */}

            <Tabs value={activeTab} onChange={handleTabChange} centered>
                <Tab label="Sales By Item" />
                <Tab label="Sales By Department" />
                <Tab label="Sales By Invoice" />
            </Tabs>

            <Box mt={3}>
                {renderTabContent()}
            </Box>
        </Box>
    );
};

export default Reports;
