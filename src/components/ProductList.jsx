import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
    styled,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import '../utility/ProductList.css';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding (theme.spacing(1) is 8px, so 0.625 * 8px = 5px)
}));

const ProductList = () => {
    const { currentUser, isSuperAdmin } = useAuth();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

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
                setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const columns = [
        { label: 'Code', key: 'code', width: '10%' },
        { label: 'Name', key: 'name', width: '20%' },
        { label: 'Department', key: 'department', width: '15%' },
        { label: 'Vendor', key: 'vendor', width: '15%' },
        { label: 'Price', key: 'price', width: '10%' },
        { label: 'Barcode', key: 'barcode', width: '20%' },
        { label: 'Actions', key: 'actions', width: '10%' },
    ];

    return (
        <div className="product-list-container">
            <div className="product-list-header">
                <Typography variant="h5">Product List</Typography>
                <IconButton
                    color="primary"
                    onClick={() => {
                        setSelectedProduct(null);
                        setIsModalOpen(true);
                    }}
                    style={{ marginTop: '0px' }}
                >
                    <Add />
                </IconButton>
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
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <CustomTableCell>{product.code}</CustomTableCell>
                                <CustomTableCell>{product.name}</CustomTableCell>
                                <CustomTableCell>{product.department}</CustomTableCell>
                                <CustomTableCell>{product.vendor}</CustomTableCell>
                                <CustomTableCell>
                                    {product.price ? parseFloat(product.price).toFixed(3) : 'N/A'}
                                </CustomTableCell>
                                <CustomTableCell>{product.barcode}</CustomTableCell>
                                <CustomTableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleEditProduct(product)}
                                    >
                                        <Edit />
                                    </IconButton>
                                </CustomTableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
        </div>
    );
};

export default ProductList;
