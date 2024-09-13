import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Departments() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ code: '', name: '', isDeliItem: false, promotion: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch departments function, now accessible throughout the component
  const fetchDepartments = async () => {
    const departmentCollection = collection(db, 'departments');
    const departmentSnapshot = await getDocs(departmentCollection);
    setDepartments(departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Function to generate unique department code
  const generateDepartmentCode = () => {
    const prefix = "DEP"; // Prefix for department code
    const codeNumber = departments.length + 1; // Incremental code based on the number of departments
    return `${prefix}-${String(codeNumber).padStart(3, '0')}`; // e.g., DEP-001, DEP-002
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();

    // Generate a new department code automatically
    const departmentCode = generateDepartmentCode();

    try {
      await addDoc(collection(db, 'departments'), {
        ...newDepartment,
        code: departmentCode,  // Use the generated code
        addedBy: currentUser ? currentUser.uid : 'Unknown',
        shopCode: currentUser.shopCode
      });
      setNewDepartment({ code: '', name: '', isDeliItem: false, promotion: '' });
      setIsModalOpen(false); // Close the modal after adding
      fetchDepartments(); // Refresh the list after adding the department
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

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className="departments-container">
      <h2 className="departments-title">Departments</h2>

      {/* Add Department Button */}
      <button className="add-department-button" onClick={toggleModal}>Add Department</button>

      {/* Department Table */}
      <table className="departments-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Is Deli Item</th>
            <th>Promotion</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(dept => (
            <tr key={dept.id}>
              <td className="department-code">{dept.code}</td>
              <td className="department-name">{dept.name}</td>
              <td className="department-deliItem">{dept.isDeliItem ? 'Yes' : 'No'}</td>
              <td className="department-promotion">{dept.promotion}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Adding Department */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Department</h3>
            <form className="departments-form" onSubmit={handleAddDepartment}>
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
            <button className="close-modal-button" onClick={toggleModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
