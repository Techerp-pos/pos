import React from 'react';
import { NavLink } from 'react-router-dom';
import { Grid, ListItem, ListItemIcon, ListItemText, styled, Box } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';

// Custom styled components
const Container = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    // alignItems: 'center',
    height: '100vh',
    padding: theme.spacing(4),
}));

const NavLinkStyled = styled(NavLink)(({ theme }) => ({
    textDecoration: 'none',
    color: theme.palette.text.primary,
    '&.active > div': {
        backgroundColor: theme.palette.action.selected,
    },
}));

const ListItemStyled = styled(ListItem)(({ theme }) => ({
    padding: theme.spacing(3),
    justifyContent: 'center',
    textAlign: 'center',
    width: '200px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    transition: 'background-color 0.3s',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const ListItemIconStyled = styled(ListItemIcon)(({ theme }) => ({
    color: theme.palette.primary.main,
    display: 'flex',
    justifyContent: 'center',
}));

function POSNavbar() {
    return (
        <Container>
            <Grid container spacing={4} justifyContent="center">
                <Grid item>
                    <NavLinkStyled to="/sale">
                        <ListItemStyled button>
                            <ListItemIconStyled>
                                <ShoppingCartIcon fontSize="large" />
                            </ListItemIconStyled>
                            <ListItemText primary="Sale" />
                        </ListItemStyled>
                    </NavLinkStyled>
                </Grid>
                <Grid item>
                    <NavLinkStyled to="/sale-order">
                        <ListItemStyled button>
                            <ListItemIconStyled>
                                <ReceiptIcon fontSize="large" />
                            </ListItemIconStyled>
                            <ListItemText primary="Sale Order" />
                        </ListItemStyled>
                    </NavLinkStyled>
                </Grid>
                <Grid item>
                    <NavLinkStyled to="/service">
                        <ListItemStyled button>
                            <ListItemIconStyled>
                                <BuildIcon fontSize="large" />
                            </ListItemIconStyled>
                            <ListItemText primary="Service" />
                        </ListItemStyled>
                    </NavLinkStyled>
                </Grid>
                <Grid item>
                    <NavLinkStyled to="/day-close">
                        <ListItemStyled button>
                            <ListItemIconStyled>
                                <CalendarTodayIcon fontSize="large" />
                            </ListItemIconStyled>
                            <ListItemText primary="Day Close" />
                        </ListItemStyled>
                    </NavLinkStyled>
                </Grid>
                <Grid item>
                    <NavLinkStyled to="/settings">
                        <ListItemStyled button>
                            <ListItemIconStyled>
                                <SettingsIcon fontSize="large" />
                            </ListItemIconStyled>
                            <ListItemText primary="Settings" />
                        </ListItemStyled>
                    </NavLinkStyled>
                </Grid>
            </Grid>
        </Container>
    );
}

export default POSNavbar;
