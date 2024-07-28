import React, { useState, useEffect , useContext} from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
function Departments() {
  const {currentUser} = useContext(useAuth)
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
      await addDoc(collection(db, 'departments'), newDepartment);
      setNewDepartment({ code: '', name: '', isDeliItem: false, promotion: '' , addedBy: currentUser? currentUser.uid : 'Unknown'});
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
    <div>
      <h2>Departments</h2>
      <form onSubmit={handleAddDepartment}>
        <label>Code</label>
        <input 
          type="text" 
          name="code" 
          value={newDepartment.code} 
          onChange={handleChange} 
          required 
        />
        <label>Name</label>
        <input 
          type="text" 
          name="name" 
          value={newDepartment.name} 
          onChange={handleChange} 
          required 
        />
        <label>
          <input 
            type="checkbox" 
            name="isDeliItem" 
            checked={newDepartment.isDeliItem} 
            onChange={handleChange} 
          />
          Is Deli Item
        </label>
        <label>Promotion</label>
        <input 
          type="text" 
          name="promotion" 
          value={newDepartment.promotion} 
          onChange={handleChange} 
        />
        <button type="submit">Add Department</button>
      </form>
      <ul>
        {departments.map(dept => (
          <li key={dept.id}>{dept.code} - {dept.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Departments;
