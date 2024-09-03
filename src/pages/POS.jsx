import React from 'react';
import { NavLink } from 'react-router-dom';
import '../index.css'; // Ensure this path is correct

function POSNavbar() {
    return (
        <nav className="pos-navbar">
            <ul>
                <NavLink to="/sale" className="nav-link">
                    <li>
                        <img src="/images/sale.png" alt="Sale" className="nav-icon" />
                        Sale
                    </li>
                </NavLink>
                <NavLink to="/sale-order" className="nav-link">
                    <li>
                        <img src="/images/techny-shopping-for-items-on-sale.png" alt="Sale Order" className="nav-icon" />
                        Sale Order
                    </li>
                </NavLink>
                <NavLink to="/service" className="nav-link">
                    <li>
                        <img src="/images/sky-gear.png" alt="Service" className="nav-icon" />
                        Service
                    </li>
                </NavLink>
                <li>
                    <NavLink to="/day-close" className="nav-link">
                        <img src="/images/dayclose.png" alt="Day Close" className="nav-icon" />
                        Day Close
                    </NavLink>
                </li>

                {/* <li>
                    <NavLink to="/sync" className="nav-link">
                        <img src="/images/sky-gear.png" alt="Sync" className="nav-icon" />
                        Sync
                    </NavLink>
                </li> */}
                <NavLink to="/settings" className="nav-link">
                    <li>
                        <img src="/images/sky-gear.png" alt="Settings" className="nav-icon" />
                        Settings
                    </li>
                </NavLink>
            </ul>
        </nav>
    );
}

export default POSNavbar;
