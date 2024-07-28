import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginSignup() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const loginShopCodeRef = useRef();
    const signupEmailRef = useRef();
    const signupPasswordRef = useRef();
    const signupShopCodeRef = useRef();
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
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

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(emailRef.current.value, passwordRef.current.value, loginShopCodeRef.current.value);
            navigate('/dashboard');
        } catch (error) {
            alert(error.message);
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(signupEmailRef.current.value, signupPasswordRef.current.value, signupShopCodeRef.current.value);
            navigate('/dashboard');
            setIsSignup(false);
        } catch (error) {
            alert(error.message);
            setLoading(false);
        }
    };

    // Check if the device is a tablet
    const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;

    if (isTablet && (orientation !== 90 && orientation !== -90)) {
        return (
            <div className="orientation-warning">
                <p>Please rotate your device to landscape mode.</p>
            </div>
        );
    }

    return (
        <div className='Login'>
            <div className={`Login-container ${isSignup ? 'signup-mode' : ''}`}>
                <div className='Login-image-container'>
                    <h1>TechERP V0.1</h1>
                    <img src='./images/img-1.png' className='Login-image' alt="Login" />
                </div>
                <div className='Login-form-container'>
                    {/* <h1>Welcome to TechERP!</h1> */}
                    {loading ? (
                        <img src="./images/login.gif" alt="Loading..." className="loading-gif" />
                    ) : (
                        !isSignup ? (
                            <form onSubmit={handleLoginSubmit} className='Login-form'>
                                <h1>Login</h1>
                                <input type="email" ref={emailRef} placeholder="Email" required />
                                <input type="password" ref={passwordRef} placeholder="Password" required />
                                <input type="text" ref={loginShopCodeRef} placeholder="Shop Code" required />
                                <p>Forgot Password?</p>
                                <button type="submit">Log In</button>
                                <button type="button" onClick={() => setIsSignup(true)}>Sign Up</button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignupSubmit} className='Login-form'>
                                <h1>Signup</h1>
                                <input type="email" ref={signupEmailRef} placeholder="Email" required />
                                <input type="password" ref={signupPasswordRef} placeholder="Password" required />
                                <input type="text" ref={signupShopCodeRef} placeholder="Shop Code" required />
                                <button type="submit">Sign Up</button>
                                <button type="button" onClick={() => setIsSignup(false)}>Back to Log In</button>
                            </form>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoginSignup;