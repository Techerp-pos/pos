import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  DialogActions,
} from '@mui/material';

function Departments() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({
    code: '',
    name: '',
    isDeliItem: false,
    promotion: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch departments function
  const fetchDepartments = async () => {
    const departmentCollection = collection(db, 'departments');
    const departmentSnapshot = await getDocs(departmentCollection);
    setDepartments(
      departmentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Function to generate unique department code
  const generateDepartmentCode = () => {
    const prefix = 'DEP'; // Prefix for department code
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
        code: departmentCode, // Use the generated code
        addedBy: currentUser ? currentUser.uid : 'Unknown',
        shopCode: currentUser.shopCode,
      });
      setNewDepartment({
        code: '',
        name: '',
        isDeliItem: false,
        promotion: '',
      });
      setIsModalOpen(false); // Close the modal after adding
      fetchDepartments(); // Refresh the list after adding the department
    } catch (error) {
      console.error('Error adding department: ', error);
      alert('Failed to add department');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDepartment((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Departments
      </Typography>
      <Button variant="contained" color="primary" onClick={toggleModal}>
        Add Department
      </Button>

      {/* Department Table */}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Is Deli Item</TableCell>
              <TableCell>Promotion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.code}</TableCell>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{dept.isDeliItem ? 'Yes' : 'No'}</TableCell>
                <TableCell>{dept.promotion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Adding Department */}
      <Dialog
        open={isModalOpen}
        onClose={toggleModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddDepartment} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={newDepartment.name}
              onChange={handleChange}
              required
              margin="normal"
            />
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newDepartment.isDeliItem}
                    onChange={handleChange}
                    name="isDeliItem"
                  />
                }
                label="Is Deli Item"
              />
            </FormGroup>
            <TextField
              fullWidth
              label="Promotion"
              name="promotion"
              value={newDepartment.promotion}
              onChange={handleChange}
              margin="normal"
            />
            <DialogActions>
              <Button onClick={toggleModal}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                Add Department
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Departments;
