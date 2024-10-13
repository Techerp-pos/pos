// Header.js

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer as MuiDrawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PointOfSale as PointOfSaleIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  AccountBalance as AccountBalanceIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ReportSharp,
  ReportRounded,
  ReportTwoTone,
  Report,
  Assessment,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';

const drawerWidth = 200; // Adjusted to match your previous width

const openedMixin = (theme) => ({
  width: drawerWidth,
  backgroundColor: 'rgb(38, 38, 40)', // Set background color
  color: 'white', // Set text color
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  overflowY: 'auto',
});

const closedMixin = (theme) => ({
  width: '50px', // Adjusted to match your previous width
  backgroundColor: 'rgb(38, 38, 40)', // Set background color
  color: 'white', // Set text color
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  overflowY: 'auto',
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center', // Center the toggle button
  padding: theme.spacing(0, 1),
  minHeight: '64px', // Adjust as necessary
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: open ? drawerWidth : '50px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  position: 'relative',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

function Header() {
  const theme = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  if (location.pathname === '/sale' || location.pathname === '/sale-order') {
    return null
  }

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      label: 'POS',
      path: '/pos',
      icon: <PointOfSaleIcon />,
    },
    // {
    //   label: 'Category',
    //   path: '/add-category',
    //   icon: <CategoryIcon />,
    // },
    {
      label: 'Product',
      path: '/product-page',
      icon: <ShoppingCartIcon />,
    },
    {
      label: 'Customer',
      path: '/customer-page',
      icon: <PeopleIcon />,
    },
    {
      label: 'Vendor',
      path: '/vendor',
      icon: <StoreIcon />,
    },
    {
      label: 'Inventory',
      path: '/inventory',
      icon: <InventoryIcon />,
    },
    {
      label: 'Accounts',
      path: '/accounts',
      icon: <AccountBalanceIcon />,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <Assessment />,
    },
    {
      label: 'settings',
      path:'/settings'
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
        <List
          sx={{
            listStyleType: 'none',
            padding: 0,
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.label}
                component={NavLink}
                to={item.path}
                sx={{
                  marginY: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 7px',
                  transition: 'background-color 0.3s ease',
                  color: 'white',
                  textDecoration: 'none',
                  '&.active': {
                    backgroundColor: '#0076eb',
                  },
                  '&:hover': {
                    backgroundColor: '#0076eb',
                  },
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
                activeClassName="active"
              >
                <ListItemIcon
                  sx={{
                    color: 'white',
                    minWidth: 0,
                    marginRight: open ? 2 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    color: 'white',
                    opacity: open ? 1 : 0,
                    marginLeft: open ? '10px' : '0',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
      {/* Main content area */}
      {/* <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      </Box> */}
    </Box>
  );
}

export default Header;
