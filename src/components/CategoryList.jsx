// CategoryList.jsx

import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase'; // Ensure 'auth' is exported from your firebase config
import {
    collection,
    query,
    where,
    doc,
    getDoc,
    onSnapshot,
    deleteDoc,
} from 'firebase/firestore';
import AddCategory from './AddCategory';

// Import MUI components
import {
    Box,
    Button,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Snackbar,
    Alert,
    styled,
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';

// Custom styled TableCell with 5px padding
const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding
}));

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [shopCode, setShopCode] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Fetch the current user's shopCode
    useEffect(() => {
        const fetchUserShopCode = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    const userSnapshot = await getDoc(userDocRef);
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        setShopCode(userData.shopCode);
                    } else {
                        console.error("User document does not exist.");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                console.error("No authenticated user found.");
            }
        };

        fetchUserShopCode();
    }, []);

    // Listen to categories based on shopCode
    useEffect(() => {
        if (!shopCode) return;

        const categoryCollectionRef = collection(db, 'categories');
        const categoryQuery = query(
            categoryCollectionRef,
            where('shopCode', '==', shopCode)
        );

        const unsubscribe = onSnapshot(categoryQuery, (snapshot) => {
            const fetchedCategories = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCategories(fetchedCategories);
        }, (error) => {
            console.error("Error fetching categories:", error);
        });

        // Cleanup subscription on unmount or when shopCode changes
        return () => {
            unsubscribe();
        };
    }, [shopCode]);

    // Handle opening the edit modal
    const handleEditCategory = (category) => {
        console.log("Editing category:", category); // Debugging line
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    // Handle opening the delete confirmation dialog
    const handleOpenDeleteDialog = (category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    // Handle closing the delete confirmation dialog
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
    };

    // Handle deleting a category
    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        try {
            await deleteDoc(doc(db, 'categories', categoryToDelete.id));
            setSnackbarMessage(`Category "${categoryToDelete.name}" deleted successfully.`);
            setSnackbarSeverity('success');
        } catch (error) {
            console.error("Error deleting category:", error);
            setSnackbarMessage('Failed to delete the category.');
            setSnackbarSeverity('error');
        } finally {
            setSnackbarOpen(true);
            handleCloseDeleteDialog();
        }
    };

    // Handle closing the snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    // Columns for the table
    const columns = [
        { label: 'Name', key: 'name' },
        { label: 'Description', key: 'description' },
        { label: 'Actions', key: 'actions' },
    ];

    return (
        <Box sx={{ p: 2 }}>
            {/* Header Section */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Typography variant="h6" component="h4">
                    Category List
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => {
                        setSelectedCategory(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Category
                </Button>
            </Box>

            {/* Categories Table */}
            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <CustomTableCell key={column.key}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {column.label}
                                    </Typography>
                                </CustomTableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id} hover>
                                <CustomTableCell>{category.name}</CustomTableCell>
                                <CustomTableCell>{category.description}</CustomTableCell>
                                <CustomTableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleEditCategory(category)}
                                        aria-label="edit"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        color="secondary"
                                        onClick={() => handleOpenDeleteDialog(category)}
                                        aria-label="delete"
                                    >
                                        <Delete />
                                    </IconButton>
                                </CustomTableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <CustomTableCell colSpan={3} align="center">
                                    No categories found.
                                </CustomTableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Add/Edit Category Dialog */}
            <Dialog
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    {selectedCategory ? 'Edit Category' : 'Add Category'}
                </DialogTitle>
                <DialogContent>
                    <AddCategory
                        category={selectedCategory}
                        onClose={() => setIsModalOpen(false)}
                        shopCode={shopCode} // Pass shopCode as a prop
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>Delete Category</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the category "{categoryToDelete?.name}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteCategory} color="secondary" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );

};

export default CategoryList;
