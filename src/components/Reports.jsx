import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import SalesReport from './SalesReport';
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
            {/* Centered Tabs with Gap */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 3, // Add gap between tabs
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    TabIndicatorProps={{
                        style: { display: 'none' }, // Optional: Hide underline indicator
                    }}
                    sx={{
                        '& .MuiTabs-flexContainer': {
                            gap: 3, // Gap between tabs
                        },
                    }}
                >
                    <Tab label="Sales By Item" />
                    <Tab label="Sales By Department" />
                    <Tab label="Sales By Invoice" />
                </Tabs>
            </Box>

            <Box mt={3}>{renderTabContent()}</Box>
        </Box>
    );
};

export default Reports;
