import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Header() {
  const [activeLink, setActiveLink] = useState('/dashboard');

  const handleSetActiveLink = (link) => {
    setActiveLink(link);
  };

  return (
    <div className="sidebar">
      <nav>
        <ul>
          <li className={activeLink === '/dashboard' ? 'active-link' : ''}>
            <NavLink to="/dashboard" onClick={() => handleSetActiveLink('/dashboard')}>
              Dashboard
            </NavLink>
          </li>
          <li className={activeLink === '/pos' ? 'active-link' : ''}>
            <NavLink to="/pos" onClick={() => handleSetActiveLink('/pos')}>
              POS
            </NavLink>
          </li>
          <li className={activeLink === '/add-category' ? 'active-link' : ''}>
            <NavLink to="/add-category" onClick={() => handleSetActiveLink('/add-category')}>
              Category
            </NavLink>
          </li>
          <li className={activeLink === '/product-listing' ? 'active-link' : ''}>
            <NavLink to="/product-listing" onClick={() => handleSetActiveLink('/product-listing')}>
              Product
            </NavLink>
          </li>
          <li className={activeLink === '/departments' ? 'active-link' : ''}>
            <NavLink to="/departments" onClick={() => handleSetActiveLink('/departments')}>
              Departments
            </NavLink>
          </li>
          <li className={activeLink === '/terminals' ? 'active-link' : ''}>
            <NavLink to="/terminals" onClick={() => handleSetActiveLink('/terminals')}>
              Terminals
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Header;
