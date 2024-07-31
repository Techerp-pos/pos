// src/pages/AdminManagement.js
import React from 'react';
import AddShop from '../components/AddShop';
import AddUser from '../components/AddUser';
import AssignUserToShop from '../components/AssignUserToShop';

const AdminManagement = () => {
    return (
        <div className="admin-management">
            <h1>Admin Management</h1>
            <AddShop />
            <AddUser />
            <AssignUserToShop />
        </div>
    );
};

export default AdminManagement;
