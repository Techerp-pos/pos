import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import {
    collection,
    query,
    where,
    doc,
    getDoc,
    onSnapshot,
} from 'firebase/firestore';
import { auth } from '../config/firebase';
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
    styled,
} from '@mui/material';

const CustomTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(0.625), // 5px padding (theme.spacing(1) is 8px, so 0.625 * 8px = 5px)
}));

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [shopCode, setShopCode] = useState(null);

    useEffect(() => {
        const fetchUserShopCode = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = doc(db, 'users', user.uid);
                const userSnapshot = await getDoc(userDoc);
                if (userSnapshot.exists()) {
                    setShopCode(userSnapshot.data().shopCode);
                }
            }
        };

        fetchUserShopCode();
    }, []);

    useEffect(() => {
        if (!shopCode) return;

        const categoryCollection = collection(db, 'categories');
        const categoryQuery = query(
            categoryCollection,
            where('shopCode', '==', shopCode)
        );

        const unsubscribe = onSnapshot(categoryQuery, (snapshot) => {
            setCategories(
                snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            );
        });

        return () => {
            unsubscribe();
        };
    }, [shopCode]);

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    return (
        <Box sx={{ p: 2 }}>
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
                    onClick={() => {
                        setSelectedCategory(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Category
                </Button>
            </Box>
            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <CustomTableCell>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Name
                                </Typography>
                            </CustomTableCell>
                            <CustomTableCell>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Description
                                </Typography>
                            </CustomTableCell>
                            <CustomTableCell>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Actions
                                </Typography>
                            </CustomTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id} hover>
                                <CustomTableCell>{category.name}</CustomTableCell>
                                <CustomTableCell>{category.description}</CustomTableCell>
                                <CustomTableCell>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleEditCategory(category)}
                                    >
                                        Edit
                                    </Button>
                                </CustomTableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
            <Dialog
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fullWidth
                maxWidth="lg"
            >
                <DialogTitle>
                    {selectedCategory ? 'Edit Category' : 'Add Category'}
                </DialogTitle>
                <DialogContent>
                    <AddCategory
                        category={selectedCategory}
                        onClose={() => setIsModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default CategoryList;
