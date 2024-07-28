import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Terminals() {
  const { currentUser } = useAuth();
  const [terminals, setTerminals] = useState([]);
  const [newTerminal, setNewTerminal] = useState({ name: '', status: 'active', user: '', invoices: 0, lastSale: '' });

  const fetchTerminals = async () => {
    if (!currentUser) return;
    const terminalCollection = collection(db, 'terminals');
    const q = query(terminalCollection, where('addedBy', '==', currentUser.uid));
    const terminalSnapshot = await getDocs(q);
    setTerminals(terminalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchTerminals();
  }, [currentUser]);

  const handleAddTerminal = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'terminals'), { ...newTerminal, addedBy: currentUser.uid });
      setNewTerminal({ name: '', status: 'active', user: '', invoices: 0, lastSale: '' });
      fetchTerminals(); // Refresh the list
    } catch (error) {
      console.error('Error adding terminal: ', error);
      alert('Failed to add terminal');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTerminal(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="terminals-container">
      <h2 className="terminals-title">Terminals</h2>
      <form className="terminals-form" onSubmit={handleAddTerminal}>
        <div className="form-group">
          <label>Name</label>
          <input 
            type="text" 
            name="name" 
            value={newTerminal.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select 
            name="status" 
            value={newTerminal.status} 
            onChange={handleChange} 
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="form-group">
          <label>User</label>
          <input 
            type="text" 
            name="user" 
            value={newTerminal.user} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Invoices</label>
          <input 
            type="number" 
            name="invoices" 
            value={newTerminal.invoices} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Last Sale</label>
          <input 
            type="date" 
            name="lastSale" 
            value={newTerminal.lastSale} 
            onChange={handleChange} 
            required 
          />
        </div>
        <button className="add-terminal-button" type="submit">Add Terminal</button>
      </form>
      <table className="terminals-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>User</th>
            <th>Invoices</th>
            <th>Last Sale</th>
          </tr>
        </thead>
        <tbody>
          {terminals.map((terminal) => (
            <tr key={terminal.id}>
              <td>{terminal.name}</td>
              <td>{terminal.status}</td>
              <td>{terminal.user}</td>
              <td>{terminal.invoices}</td>
              <td>{terminal.lastSale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Terminals;
