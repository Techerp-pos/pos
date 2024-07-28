import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function Terminals() {
  const [terminals, setTerminals] = useState([]);
  const [newTerminal, setNewTerminal] = useState({ name: '', status: 'active', user: '', invoices: 0, lastSale: '' });

  useEffect(() => {
    const fetchTerminals = async () => {
      const terminalCollection = collection(db, 'terminals');
      const terminalSnapshot = await getDocs(terminalCollection);
      setTerminals(terminalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchTerminals();
  }, []);

  const handleAddTerminal = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'terminals'), newTerminal);
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
    <div>
      <h2>Terminals</h2>
      <form onSubmit={handleAddTerminal}>
        <label>Name</label>
        <input 
          type="text" 
          name="name" 
          value={newTerminal.name} 
          onChange={handleChange} 
          required 
        />
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
        <label>User</label>
        <input 
          type="text" 
          name="user" 
          value={newTerminal.user} 
          onChange={handleChange} 
          required 
        />
        <label>Invoices</label>
        <input 
          type="number" 
          name="invoices" 
          value={newTerminal.invoices} 
          onChange={handleChange} 
          required 
        />
        <label>Last Sale</label>
        <input 
          type="date" 
          name="lastSale" 
          value={newTerminal.lastSale} 
          onChange={handleChange} 
          required 
        />
        <button type="submit">Add Terminal</button>
      </form>
      <table>
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
