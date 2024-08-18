import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../utility/Header.css'; // Import your CSS file

function Header() {
  const [activeLink, setActiveLink] = useState('/dashboard');
  const [isOpen, setIsOpen] = useState(true); // State to handle the sidebar toggle

  const handleSetActiveLink = (link) => {
    setActiveLink(link);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        )}
      </button>
      <nav>
        <ul>
          <li className={activeLink === '/dashboard' ? 'active-link' : ''}>
            <NavLink to="/dashboard" onClick={() => handleSetActiveLink('/dashboard')}>
              <img width="24" height="24" src="https://img.icons8.com/material/24/000000/dashboard-layout.png" alt="dashboard-layout" style={{ filter: 'invert(1)' }} title='Dashboard' />
              <span className="link-text">Dashboard</span>
            </NavLink>
          </li>
          <li className={activeLink === '/pos' ? 'active-link' : ''}>
            <NavLink to="/pos" onClick={() => handleSetActiveLink('/pos')}>
              <img width="24" height="24" src="https://img.icons8.com/material/24/sale-price-tag.png" alt="sale-price-tag" style={{ filter: 'invert(1)' }} title='Point of Sale' />
              <span className="link-text">POS</span>
            </NavLink>
          </li>
          <li className={activeLink === '/add-category' ? 'active-link' : ''}>
            <NavLink to="/add-category" onClick={() => handleSetActiveLink('/add-category')}>
              <img width="24" height="24" src="https://img.icons8.com/ios-filled/50/sorting-answers.png" alt="sorting-answers" style={{ filter: 'invert(1)' }} title='Category' />
              <span className="link-text">Category</span>
            </NavLink>
          </li>
          <li className={activeLink === '/product-page' ? 'active-link' : ''}>
            <NavLink to="/product-page" onClick={() => handleSetActiveLink('/product-page')}>
              <img width="24" height="24" src="https://img.icons8.com/ios-filled/50/product.png" alt="product" style={{ filter: 'invert(1)' }} title='Product' />
              <span className="link-text">Product</span>
            </NavLink>
          </li>
          <li className={activeLink === '/customer-page' ? 'active-link' : ''}>
            <NavLink to="/customer-page" onClick={() => handleSetActiveLink('/customer-page')}>
              <img width="24" height="24" src="https://img.icons8.com/ios-filled/50/gender-neutral-user.png" alt="gender-neutral-user" style={{ filter: 'invert(1)' }} title='Customer' />
              <span className="link-text">Customer</span>
            </NavLink>
          </li>
          <li className={activeLink === '/vendor' ? 'active-link' : ''}>
            <NavLink to="/vendor" onClick={() => handleSetActiveLink('/vendor')}>
              <img width="24" height="24" src="https://img.icons8.com/ios-filled/50/stall.png" alt="stall" style={{ filter: 'invert(1)' }} title='Vendor' />
              <span className="link-text">Vendor</span>
            </NavLink>
          </li>
          <li className={activeLink === '/inventory' ? 'active-link' : ''}>
            <NavLink to="/inventory" onClick={() => handleSetActiveLink('/inventory')}>
              <img width="24" height="24" src="https://img.icons8.com/glyph-neue/64/warehouse.png" alt="warehouse" style={{ filter: 'invert(1)' }} title='Inventory' />
              <span className="link-text">Inventory</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Header;
