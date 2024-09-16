import React, { useState } from 'react';
import { db, storage } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

// Import MUI components
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

function AddCategory({ onClose }) {
  const { currentUser } = useAuth();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = '';

    try {
      if (image) {
        const imageRef = ref(storage, `category_images/${image.name}`);
        const snapshot = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'categories'), {
        name: categoryName,
        description: description,
        imageUrl: imageUrl,
        addedBy: currentUser ? currentUser.uid : 'Unknown',
        shopCode: currentUser.shopCode,
      });

      setCategoryName('');
      setDescription('');
      setImage(null);
      alert('Category added successfully');
    } catch (error) {
      console.error('Error adding category: ', error);
      alert('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* <Button variant="contained" color="error" onClick={onClose} startIcon={<DeleteOutline />}>
        Close
      </Button> */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="center">
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
            />
          </Grid>
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
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body1">Image:</Typography>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Button variant="contained" component="label">
              Upload Image
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
          </Grid>
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
                {loading ? 'Adding...' : 'Add Category'}
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
      </form>
    </Paper>
  );
}

export default AddCategory;
