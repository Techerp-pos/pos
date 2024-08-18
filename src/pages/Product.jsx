import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import '../utility/Product.css'; // Create a CSS file to style the component
import CategoryList from '../components/CategoryList';

const Product = () => {
    const [activeTab, setActiveTab] = useState('ProductList');

    const renderComponent = () => {
        switch (activeTab) {
            case 'ProductList':
                return <ProductList />;
            case 'CategoryList':
                return <CategoryList />;
            default:
                return <ProductList />;
        }
    };

    return (
        <div className="product-page-container">
            <div className="tabs">
                <div 
                    className={`tab ${activeTab === 'ProductList' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('ProductList')}
                >
                    Product
                </div>
                <div 
                    className={`tab ${activeTab === 'CategoryList' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('CategoryList')}
                >
                    Category
                </div>
            </div>
            <div className="tab-content">
                {renderComponent()}
            </div>
        </div>
    );
};

export default Product;

