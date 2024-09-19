// AddCategory.jsx

import React, { useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

// Import MUI components
import {
    TextField,
    Button,
    Box,
    Snackbar,
    Alert,
    Grid,
    Typography,
    CircularProgress,
} from '@mui/material';

function AddCategory({ category, onClose, shopCode }) {
    const { currentUser } = useAuth();
    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Initialize form fields based on category prop
    useEffect(() => {
        console.log("AddCategory received category:", category); // Debugging line
        if (category) {
            setCategoryName(category.name || '');
            setDescription(category.description || '');
            setImageUrl(category.imageUrl || '');
        } else {
            setCategoryName('');
            setDescription('');
            setImageUrl('');
        }
    }, [category]);

    // Handle image selection
    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
            setImageUrl(''); // Reset imageUrl if a new image is selected
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let finalImageUrl = imageUrl; // Use existing imageUrl if editing and no new image is selected

        try {
            if (image) {
                const imageRef = ref(storage, `category_images/${image.name}_${Date.now()}`);
                const snapshot = await uploadBytes(imageRef, image);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            }

            if (category) {
                // Edit existing category
                const categoryRef = doc(db, 'categories', category.id);
                await updateDoc(categoryRef, {
                    name: categoryName,
                    description: description,
                    imageUrl: finalImageUrl,
                    // Optionally, update 'addedBy' or other fields if necessary
                });
                setSnackbarMessage('Category updated successfully.');
            } else {
                // Add new category
                if (!shopCode) {
                    throw new Error('Shop code is missing. Cannot add category.');
                }

                await addDoc(collection(db, 'categories'), {
                    name: categoryName,
                    description: description,
                    imageUrl: finalImageUrl,
                    addedBy: currentUser ? currentUser.uid : 'Unknown',
                    shopCode: shopCode,
                });
                setSnackbarMessage('Category added successfully.');
            }

            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            onClose(); // Close the modal after successful operation
        } catch (error) {
            console.error('Error adding/updating category: ', error);
            setSnackbarMessage('Failed to add/update category.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    // Handle closing the snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2} alignItems="center">
                {/* Category Name */}
                <Grid item xs={12} sm={4}>
                    <Typography variant="body1">Category Name:</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <TextField
                        fullWidth
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                        variant="outlined"
                        placeholder="Enter category name"
                    />
                </Grid>

                {/* Description */}
                <Grid item xs={12} sm={4}>
                    <Typography variant="body1">Description:</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        variant="outlined"
                        placeholder="Enter category description"
                    />
                </Grid>

                {/* Image Upload */}
                <Grid item xs={12} sm={4}>
                    <Typography variant="body1">Image:</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <Button variant="contained" component="label">
                        {image ? 'Change Image' : 'Upload Image'}
                        <input
                            type="file"
                            hidden
                            onChange={handleImageChange}
                            accept="image/*"
                        />
                    </Button>
                    {image && (
                        <Typography variant="body2" component="p" sx={{ mt: 1 }}>
                            Selected file: {image.name}
                        </Typography>
                    )}
                    {!image && imageUrl && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" component="p">
                                Current Image:
                            </Typography>
                            <img
                                src={imageUrl}
                                alt="Category"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </Box>
                    )}
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sm={4}></Grid>
                <Grid item xs={12} sm={8}>
                    <Box sx={{ position: 'relative', mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? (category ? 'Updating...' : 'Adding...') : (category ? 'Update Category' : 'Add Category')}
                        </Button>
                        {loading && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: 'primary.main',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        )}
                    </Box>
                </Grid>
            </Grid>

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

}

AddCategory.propTypes = {
    category: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        imageUrl: PropTypes.string,
        shopCode: PropTypes.string,
        addedBy: PropTypes.string,
    }),
    onClose: PropTypes.func.isRequired,
    shopCode: PropTypes.string.isRequired, // Make shopCode required
};

// Default props
AddCategory.defaultProps = {
    category: null,
};

export default AddCategory;
