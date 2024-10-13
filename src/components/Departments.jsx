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
  IconButton,
} from '@mui/material';
import { Search } from '@mui/icons-material';

function Departments() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]); // State for filtered departments
  const [newDepartment, setNewDepartment] = useState({
    code: '',
    name: '',
    isDeliItem: false,
    promotion: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  const toggleSearchInput = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  // Fetch departments function
  const fetchDepartments = async () => {
    const departmentCollection = collection(db, 'departments');
    const departmentSnapshot = await getDocs(departmentCollection);
    const fetchedDepartments = departmentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDepartments(fetchedDepartments);
    setFilteredDepartments(fetchedDepartments); // Initialize filtered departments
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

  // Handle search input changes
  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);

    // Filter departments based on the search term (match name or promotion)
    const filtered = departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(value) ||
        dept.promotion.toLowerCase().includes(value)
    );
    setFilteredDepartments(filtered); // Update filtered departments
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* <Typography variant="h4" component="h2" gutterBottom>
        Departments
      </Typography> */}

      <div style={{ display: 'flex',
       }}>
        <Button variant="contained" color="primary" onClick={toggleModal}>
          +
        </Button>
        <IconButton
          color="primary"
          onClick={toggleSearchInput}
          style={{ marginLeft: '8px' }}
        >
          <Search />
        </IconButton>

        {/* Show Search Input only when Search Button is clicked */}
        {isSearchVisible && (
          <TextField
            label="Search Departments"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={handleSearch} // Function to handle search input change
            placeholder="Search by name or promotion"
          />
        )}
      </div>


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
            {filteredDepartments.map((dept, index) => (
              <TableRow key={dept.id}
              hover
              sx={{
                backgroundColor : index % 2 === 1 ? '#f7f7f7' : 'inherit',
              }}
              >
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
