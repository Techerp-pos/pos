import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, TextField, Container, Box, Typography, CircularProgress, Grid } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import '../utility/login.css';

function LoginSignup() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [orientation, setOrientation] = useState(window.orientation);

    useEffect(() => {
        const handleOrientationChange = () => {
            setOrientation(window.orientation);
        };

        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = data.get('email');
        const password = data.get('password');
        const shopCode = data.get('shopCode');

        setLoading(true);
        try {
            await login(email, password, shopCode);
            navigate('/dashboard');
        } catch (error) {
            alert(error.message);
            setLoading(false);
        }
    };

    // Check if the device is a tablet
    const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;

    if (isTablet && (orientation !== 90 && orientation !== -90)) {
        return (
            <Box className="orientation-warning" textAlign="center" mt={5}>
                <Typography variant="h6">Please rotate your device to landscape mode.</Typography>
            </Box>
        );
    }

    return (
        <Grid container className="login-container">
            {/* Left Section */}
            <Grid item xs={12} md={7} className="login-left">
                <Box className="login-header">
                    {/* Centered Logo */}
                    <Box textAlign="center" mb={2}>
                        <img src="/images/pos.png" alt="POS Logo" className="pos-logo" />
                    </Box>
                    <Typography variant="h6" component="h1" gutterBottom>
                        TechErp
                    </Typography>
                    <Typography variant="h5">Web Based POS System</Typography>
                    <Typography variant="subtitle1">VERSION : v1.0.14</Typography>
                </Box>
            </Grid>

            {/* Right Section */}
            <Grid item xs={12} md={5} className="login-right">
                <Container maxWidth="xs" className="login-form-container">
                    <Box className="login-form-header" textAlign="center" mb={3}>
                        <LockOutlinedIcon style={{ fontSize: 40, color: '#7d1b7e' }} />
                        <Typography variant="h5" gutterBottom>
                            Sign In
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box textAlign="center">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                id="shopCode"
                                label="Shop Code"
                                name="shopCode"
                                autoComplete="shopCode"
                                autoFocus
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="User Name"
                                name="email"
                                autoComplete="email"
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                className="login-form-button"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'SIGN IN'}
                            </Button>
                        </Box>
                    )}
                </Container>
            </Grid>
        </Grid>
    );
}

export default LoginSignup;
