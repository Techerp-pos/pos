import React, { useState, useContext } from 'react';
import { db, storage } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

function AddCategory() {
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
        shopCode: currentUser.shopCode
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
    <div className="add-category">
      <h2>Add New Category</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="categoryName">Category Name:</label>
          <input 
            type="text" 
            id="categoryName" 
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea 
            id="description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="image">Image:</label>
          <input 
            type="file" 
            id="image" 
            onChange={handleImageChange} 
            accept="image/*"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Category'}
        </button>
      </form>
    </div>
  );
}

export default AddCategory;
