// src/components/Inventory.js
import React from 'react';
import LocalPurchaseOrder from './LocalPurchaseOrder';
// import ViewList from './ViewList';
import '../utility/Inventory.css';
import GoodsReceiveNote from './GoodsRecieveNote';
import { Link } from 'react-router-dom';

const Inventory = () => {
    return (
        <div className="inventory-container">
            <div className="inventory-section">
                <div className='inventory-card'>
                    <img width="24" height="24" src="https://img.icons8.com/ios-glyphs/30/purchase-for-euro.png" alt="purchase-for-euro" />
                    <Link to='/lpo' style={{ textDecoration: 'none', color: 'black' }}>Local Purchase Order</Link>
                </div>
                <div className='inventory-card'>
                    <img width="24" height="24" src="https://img.icons8.com/external-glyph-geotatah/64/external-goods-procurement-process-glyph-glyph-geotatah-2.png" alt="ex" />
                    <Link to='/grn' style={{ textDecoration: 'none', color: 'black' }}>Goods Recieve Note</Link>
                </div>
                <div className='inventory-card'>
                    <img width="24" height="24" src="https://img.icons8.com/ios-filled/50/list.png" alt="list" />
                    <Link to='/view-list' style={{ textDecoration: 'none', color: 'black' }}>View List</Link>
                </div>
            </div>
            {/* <div className="inventory-section">
                <GoodsReceiveNote />
            </div> */}
            {/* <div className="inventory-section">
                <ViewList />
            </div> */}
        </div>
    );
};

export default Inventory;
