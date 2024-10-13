import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import AddEditProduct from './AddEditProduct';
import { useAuth } from '../contexts/AuthContext';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    Paper,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    styled,
    Snackbar,
    Alert,
    TextField, // Add TextField for the search input
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material'; // Add Search icon
import '../utility/ProductList.css';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding
}));

const ProductList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]); // State for filtered products
    const [searchTerm, setSearchTerm] = useState(''); // State for search term
    const [isSearchVisible, setIsSearchVisible] = useState(true); // State for toggling search input
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        let unsubscribe;

        const fetchProducts = () => {
            let productQuery;
            if (isSuperAdmin) {
                productQuery = collection(db, 'products');
            } else {
                productQuery = query(
                    collection(db, 'products'),
                    where('shopCode', '==', currentUser.shopCode)
                );
            }
            unsubscribe = onSnapshot(productQuery, (snapshot) => {
                const fetchedProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setProducts(fetchedProducts);
                setFilteredProducts(fetchedProducts); // Initialize filtered products
            });
        };

        if (currentUser) {
            fetchProducts();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentUser, isSuperAdmin]);

    // Handle search input changes
    const handleSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchTerm(value);
        // Filter products based on search term (e.g., match product name, code, or barcode)
        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(value) ||
            product.code.toLowerCase().includes(value) ||
            product.barcode.toLowerCase().includes(value)
        );
        setFilteredProducts(filtered);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await deleteDoc(doc(db, 'products', productToDelete.id));
            setSnackbarMessage(`Product "${productToDelete.name}" deleted successfully.`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        } catch (error) {
            console.error("Error deleting product: ", error);
            setSnackbarMessage('Failed to delete the product.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const openDeleteDialog = (product) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const toggleSearchInput = () => {
        setIsSearchVisible(!isSearchVisible); // Toggle the visibility of the search input
    };

    const columns = [
        { label: 'Code', key: 'code', width: '10%' },
        { label: 'Name', key: 'name', width: '30%' },
        { label: 'Department', key: 'department', width: '15%' },
        { label: 'Vendor', key: 'vendor', width: '10%' },
        { label: 'Price', key: 'price', width: '10%' },
        { label: 'Barcode', key: 'barcode', width: '15%' },
        { label: 'Actions', key: 'actions', width: '10%' },
    ];

    return (
        <div className="product-list-container">
            <div className="product-list-header">
                <Typography variant="h5">Product List</Typography>
                {/* Show Search Input only when Search Button is clicked */}
                {isSearchVisible && (
                    <TextField
                        label="Search Products"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search by name, code, or barcode"
                        style={{
                            width: '50vw'
                        }}
                    />
                )}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        color="primary"
                        onClick={() => {
                            setSelectedProduct(null);
                            setIsModalOpen(true);
                        }}
                    >
                        <Add />
                    </IconButton>

                    {/* Add Search Icon Button */}
                    <IconButton
                        color="primary"
                        onClick={toggleSearchInput}
                        style={{ marginLeft: '8px' }}
                    >
                        <Search />
                    </IconButton>
                </div>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <CustomTableCell key={column.key} style={{ width: column.width }}>
                                    {column.label}
                                </CustomTableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                                <TableRow
                                    key={product.id}
                                    hover
                                    sx={{
                                        backgroundColor: index % 2 === 1 ? '#f9f9f9' : 'inherit', // Apply grey to odd rows
                                    }}
                                >
                                    <CustomTableCell>{product.code}</CustomTableCell>
                                    <CustomTableCell>{product.name}</CustomTableCell>
                                    <CustomTableCell>{product.department}</CustomTableCell>
                                    <CustomTableCell>{product.vendor}</CustomTableCell>
                                    <CustomTableCell>
                                        {product.pricing && product.pricing.length > 0
                                            ? parseFloat(product.pricing[0].price).toFixed(3)
                                            : 'N/A'}
                                    </CustomTableCell>
                                    <CustomTableCell>{product.barcode}</CustomTableCell>
                                    <CustomTableCell>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleEditProduct(product)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            color="secondary"
                                            onClick={() => openDeleteDialog(product)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </CustomTableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <CustomTableCell colSpan={7}>
                                    <Typography variant="body1" align="center">
                                        No products found.
                                    </Typography>
                                </CustomTableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Product Dialog */}
            <Dialog
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fullWidth
                maxWidth="xl"
                PaperProps={{
                    className: 'custom-dialog-paper',
                    style: {
                        minHeight: '90vh',
                        padding: '0px',
                        boxShadow: 'none',
                        background: 'transparent',
                    },
                }}
            >
                <DialogContent>
                    <AddEditProduct
                        product={selectedProduct}
                        onClose={() => setIsModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
            >
                <DialogTitle>Delete Product</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the product "{productToDelete?.name}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteProduct} color="secondary" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ProductList;
