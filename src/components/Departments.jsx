import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Departments() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ code: '', name: '', isDeliItem: false, promotion: '' });

  useEffect(() => {
    const fetchDepartments = async () => {
      const departmentCollection = collection(db, 'departments');
      const departmentSnapshot = await getDocs(departmentCollection);
      setDepartments(departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'departments'), { ...newDepartment, addedBy: currentUser ? currentUser.uid : 'Unknown',  shopCode: currentUser.shopCode });
      setNewDepartment({ code: '', name: '', isDeliItem: false, promotion: '' });
      fetchDepartments(); // Refresh the list
    } catch (error) {
      console.error('Error adding department: ', error);
      alert('Failed to add department');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDepartment(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="departments-container">
      <h2 className="departments-title">Departments</h2>
      <form className="departments-form" onSubmit={handleAddDepartment}>
        <div className="form-group">
          <label htmlFor="code">Code</label>
          <input 
            type="text" 
            name="code" 
            id="code" 
            value={newDepartment.code} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input 
            type="text" 
            name="name" 
            id="name" 
            value={newDepartment.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group checkbox-group">
          <input 
            type="checkbox" 
            name="isDeliItem" 
            id="isDeliItem" 
            checked={newDepartment.isDeliItem} 
            onChange={handleChange} 
          />
          <label htmlFor="isDeliItem">Is Deli Item</label>
        </div>
        <div className="form-group">
          <label htmlFor="promotion">Promotion</label>
          <input 
            type="text" 
            name="promotion" 
            id="promotion" 
            value={newDepartment.promotion} 
            onChange={handleChange} 
          />
        </div>
        <button className="add-department-button" type="submit">Add Department</button>
      </form>
      <ul className="departments-list">
        {departments.map(dept => (
          <li key={dept.id} className="department-item">
            <span className="department-code">{dept.code}</span> - <span className="department-name">{dept.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Departments;
