import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../utility/login.css'

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

    const handleLoginSubmit = async (values) => {
        setLoading(true);
        try {
            await login(values.email, values.password, values.shopCode);
            navigate('/dashboard');
        } catch (error) {
            message.error(error.message);
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
            <div className='Login-container'>
                <div className='Login-image-container'>
                    <h1>TechERP V0.1</h1>
                    <img src='./images/img-1.png' className='Login-image' alt="Login" />
                </div>
                <div className='Login-form-container'>
                    {loading ? (
                        <img src="./images/login.gif" alt="Loading..." className="loading-gif" />
                    ) : (
                        <Form
                            name="login_form"
                            className="login-form"
                            initialValues={{ remember: true }}
                            onFinish={handleLoginSubmit}
                        >
                            <div>
                                <Form.Item
                                    name="email"
                                    rules={[{ required: true, message: 'Please input your Email!' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Email" />
                                </Form.Item>
                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: 'Please input your Password!' }]}
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                                </Form.Item>
                                <Form.Item
                                    name="shopCode"
                                    rules={[{ required: true, message: 'Please input your Shop Code!' }]}
                                >
                                    <Input prefix={<ShopOutlined />} placeholder="Shop Code" />
                                </Form.Item>
                            </div>
                            <div>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" className="login-form-button">
                                        Log in
                                    </Button>
                                </Form.Item>
                            </div>

                        </Form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoginSignup;
