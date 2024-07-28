import React from 'react';
import { NavLink } from 'react-router-dom';


function POSNavbar() {
    return (
        <nav className="pos-navbar">
            <ul>
                <li><NavLink to="/sale">Sale</NavLink></li>
                <li><NavLink to="/sale-order">Sale Order</NavLink></li>
                <li><NavLink to="/service">Service</NavLink></li>
                <li><NavLink to="/day-close">Day Close</NavLink></li>
                <li><NavLink to="/sync">Sync</NavLink></li>
                <li><NavLink to="/settings">Settings</NavLink></li>
            </ul>
        </nav>
    );
}

export default POSNavbar;
