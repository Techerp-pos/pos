import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../config/firebase';
import { doc, setDoc, addDoc, collection, getDocs, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JsBarcode from 'jsbarcode';
import { useAuth } from '../contexts/AuthContext';
import {
  TextField, Button, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  Select, MenuItem, InputLabel, FormControl, Box, Typography, IconButton, Grid, Card, CardContent
} from '@mui/material';
import { UploadOutlined, Add, DeleteOutline } from '@mui/icons-material';
import '../utility/AddEditProduct.css';

function AddEditProduct({ onClose, product: initialProduct }) {
  const { currentUser } = useAuth();
  const [product, setProduct] = useState({
    code: '',
    name: '',
    shortName: '',
    localName: '',
    vendor: '',
    department: '',
    category: '',
    taxType: 'vat 5%',
    vat: 5,
    barcode: '',
    stock: 0,
    pricing: [{ unitType: 'PCS', factor: 1, cost: '', price: '', margin: '', barcode: '' }],
    imageUrl: '',
    addedBy: currentUser ? currentUser.uid : 'Unknown',
    shopCode: currentUser.shopCode
  });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [history, setHistory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [activeTab, setActiveTab] = useState('product');
  const barcodeRef = useRef(null); // Change to `null` initially
  const [lastUsedBarcode, setLastUsedBarcode] = useState('1300000000001');

  useEffect(() => {
    if (initialProduct) {
      setProduct({
        ...initialProduct,
        code: initialProduct.code,
        barcode: initialProduct.barcode,
        stock: initialProduct.stock,
        pricing: initialProduct.pricing || [{ unitType: 'PCS', factor: 1, cost: '', price: '', margin: '', barcode: initialProduct.barcode }],
        vat: initialProduct.taxType === 'vat 5%' ? 5 : 0,
      });
      fetchProductHistory(initialProduct.id);
      fetchBatches(initialProduct.id);
      const barcodes = [initialProduct.barcode, ...initialProduct.pricing.map(p => p.barcode)];
      const maxBarcode = barcodes.reduce((max, bc) => bc > max ? bc : max, '0');
      setLastUsedBarcode(maxBarcode);
    } else {
      fetchLatestProduct();
    }
  }, [initialProduct]);

  useEffect(() => {
    if (currentUser) {
      fetchCategories();
      fetchDepartments();
      fetchVendors();
    }
  }, [currentUser]);

  useEffect(() => {
    if (product.barcode && barcodeRef.current) {
      // Use JsBarcode to generate a barcode on an SVG element
      JsBarcode(barcodeRef.current, String(product.barcode), {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: true,
      });
      setProduct(prevProduct => {
        const updatedPricing = [...prevProduct.pricing];
        if (updatedPricing.length > 0) {
          updatedPricing[0].barcode = product.barcode;
        }
        return { ...prevProduct, pricing: updatedPricing };
      });
    }
  }, [product.barcode]);

  const fetchLatestProduct = async () => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('code', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.size > 0) {
      const latestProduct = querySnapshot.docs[0].data();
      const newBarcode = (parseInt(latestProduct.barcode, 10) + 1).toString().padStart(13, '0');
      setProduct(prevState => ({
        ...prevState,
        code: (parseInt(latestProduct.code, 10) + 1).toString().padStart(3, '0'),
        barcode: newBarcode,
        pricing: [{ unitType: 'PCS', factor: 1, cost: '', price: '', margin: '', barcode: newBarcode }]
      }));
    } else {
      const newBarcode = '1300000000001';
      setProduct(prevState => ({
        ...prevState,
        code: '001',
        barcode: newBarcode,
        pricing: [{ unitType: 'PCS', factor: 1, cost: '', price: '', margin: '', barcode: newBarcode }]
      }));
      setLastUsedBarcode(newBarcode);
    }
  };

  const fetchDepartments = async () => {
    const departmentCollection = collection(db, 'departments');
    const q = query(departmentCollection, where('shopCode', '==', currentUser.shopCode));
    onSnapshot(q, (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  const fetchCategories = async () => {
    const categoryCollection = collection(db, 'categories');
    const q = query(categoryCollection, where('shopCode', '==', currentUser.shopCode))
    onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  const fetchVendors = async () => {
    const vendorsCollection = collection(db, 'vendors');
    const q = query(vendorsCollection, where('shopCode', '==', currentUser.shopCode));
    onSnapshot(q, (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  const handleImageUpload = async (file) => {
    const storageRef = ref(storage, `product_images/${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    setProduct(prevState => ({ ...prevState, imageUrl }));
  };

  const handleAddPricing = () => {
    const nextBarcode = (parseInt(lastUsedBarcode, 10) + 1).toString().padStart(13, '0');
    setProduct(prevState => ({
      ...prevState,
      pricing: [...prevState.pricing, { unitType: '', factor: '', cost: '', price: '', margin: '', barcode: nextBarcode }]
    }));
    setLastUsedBarcode(nextBarcode);
  };

  const handlePricingChange = (index, field, value) => {
    const updatedPricing = [...product.pricing];
    updatedPricing[index][field] = value;

    const cost = parseFloat(updatedPricing[index].cost) || 0;
    let price = parseFloat(updatedPricing[index].price) || 0;
    let margin = parseFloat(updatedPricing[index].margin) || 0;

    if (field === 'cost' || field === 'price') {
      // Recalculate margin
      if (cost !== 0) {
        margin = ((price - cost) / cost) * 100;
        updatedPricing[index].margin = margin.toFixed(2);
      } else {
        updatedPricing[index].margin = '';
      }
    } else if (field === 'margin') {
      // Recalculate price
      price = cost + (cost * margin / 100);
      updatedPricing[index].price = price.toFixed(2);
    }

    setProduct({ ...product, pricing: updatedPricing });
  };

  const handleRemovePricing = (index) => {
    const updatedPricing = product.pricing.filter((_, i) => i !== index);
    setProduct({ ...product, pricing: updatedPricing });
  };

  const fetchProductHistory = async (productId) => {
    const historyRef = collection(db, 'productHistory');
    const q = query(historyRef, where('productId', '==', productId), orderBy('date', 'desc'));
    onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => doc.data()));
    });
  };

  const fetchBatches = async (productId) => {
    const batchRef = collection(db, 'productBatches');
    const q = query(batchRef, where('productId', '==', productId), orderBy('batchDate', 'desc'));
    onSnapshot(q, (snapshot) => {
      setBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() === '') return;
    setShowNewCategoryInput(false);

    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: newCategory,
        addedBy: currentUser.uid,
      });
      setCategories([...categories, { id: docRef.id, name: newCategory }]);
      setProduct(prevState => ({ ...prevState, category: newCategory }));
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category: ', error);
    }
  };

  const handleFilterHistory = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const historyRef = collection(db, 'productHistory');
    const q = query(
      historyRef,
      where('productId', '==', initialProduct.id),
      where('date', '>=', new Date(startDate)),
      where('date', '<=', new Date(endDate))
    );
    onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => doc.data()));
    });
  };

  const generateBatchNumber = () => {
    return `BATCH-${Date.now()}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const productData = {
        ...product,
        code: product.code.toString().padStart(3, '0'),
        barcode: product.barcode.toString().padStart(13, '0'),
        stock: parseInt(product.stock, 10),
      };

      let action;
      let productId;
      if (initialProduct) {
        await setDoc(doc(db, 'products', initialProduct.id), productData);
        action = 'Update';
        productId = initialProduct.id;
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        action = 'Create';
        productId = docRef.id;
      }
      const batchData = {
        batchNumber: generateBatchNumber(),
        batchDate: new Date(),
        initialQty: productData.stock,
        remainingQty: productData.stock,
        receivedCost: productData.pricing[0].cost,
        currentCost: productData.pricing[0].cost,
        productId: productId,
        shopCode: currentUser.shopCode,
      };
      await addDoc(collection(db, 'productBatches'), batchData);

      const stockChange = productData.stock - (initialProduct?.stock || 0);
      await addDoc(collection(db, 'productHistory'), {
        productId: productId,
        date: new Date(),
        activityType: action,
        description: `${action} product ${productData.name}`,
        quantity: `${stockChange > 0 ? '+' : ''}${stockChange}`,
        stock: productData.stock,
        price: productData.pricing[0].price,
        updatedBy: currentUser.email,
      });

      onClose();
    } catch (error) {
      console.error('Error adding/updating product: ', error);
      alert('Failed to add/update product');
    }
  };

  return (
    <Card className='product-modal-container'>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {initialProduct ? `Edit ${product.name}` : 'Add New Product'}
          </Typography>
          <Button variant="contained" color="error" onClick={onClose} startIcon={<DeleteOutline />}>
            Close
          </Button>
        </Box>

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Product" value="product" />
          <Tab label="Stock Batch" value="stock" />
          <Tab label="History" value="history" />
          <Tab label="Product Images" value="images" />
          <Tab label="More Info" value="info" />
        </Tabs>

        {activeTab === 'product' && (
          <Box component="form" onSubmit={handleSubmit} mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code"
                  variant="outlined"
                  value={product.code}
                  InputProps={{ readOnly: !!initialProduct }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  variant="outlined"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Short Name"
                  variant="outlined"
                  value={product.shortName}
                  onChange={(e) => setProduct({ ...product, shortName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Local Name"
                  variant="outlined"
                  value={product.localName}
                  onChange={(e) => setProduct({ ...product, localName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={product.vendor}
                    onChange={(e) => setProduct({ ...product, vendor: e.target.value })}
                    required
                  >
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.name}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={product.department}
                    onChange={(e) => setProduct({ ...product, department: e.target.value })}
                  >
                    {departments.map((department) => (
                      <MenuItem key={department.id} value={department.name}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={product.category}
                    onChange={(e) => setProduct({ ...product, category: e.target.value })}
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tax Type</InputLabel>
                  <Select
                    value={product.taxType}
                    onChange={(e) => setProduct({ ...product, taxType: e.target.value })}
                  >
                    <MenuItem value="vat 0%">VAT 0%</MenuItem>
                    <MenuItem value="vat 5%">VAT 5%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Barcode"
                  variant="outlined"
                  value={product.barcode}
                  onChange={(e) => setProduct({ ...product, barcode: e.target.value })}
                  inputRef={barcodeRef}
                />
                <svg ref={barcodeRef}></svg>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  variant="outlined"
                  type="number"
                  value={product.stock}
                  onChange={(e) => setProduct({ ...product, stock: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<UploadOutlined />}
                  component="label"
                >
                  Upload Product Image
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {product.imageUrl && <img src={product.imageUrl} alt="Product" style={{ marginTop: 10, maxWidth: '100%' }} />}
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  onClick={handleAddPricing}
                  startIcon={<Add />}
                >
                  Add Pricing
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Unit Type</TableCell>
                      <TableCell>Factor</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Margin %</TableCell>
                      <TableCell>Barcode</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.pricing.map((pricing, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth>
                            <Select
                              value={pricing.unitType}
                              onChange={(e) => handlePricingChange(index, 'unitType', e.target.value)}
                            >
                              <MenuItem value="PCS">PCS</MenuItem>
                              <MenuItem value="Each">Each</MenuItem>
                              <MenuItem value="Pack">Pack</MenuItem>
                              <MenuItem value="Box">Box</MenuItem>
                              <MenuItem value="Carton">Carton</MenuItem>
                              <MenuItem value="Kg">Kg</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="outlined"
                            type="number"
                            value={pricing.factor}
                            onChange={(e) => handlePricingChange(index, 'factor', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="outlined"
                            type="number"
                            inputProps={{ step: '0.01' }}
                            value={pricing.cost}
                            onChange={(e) => handlePricingChange(index, 'cost', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="outlined"
                            type="number"
                            inputProps={{ step: '0.01' }}
                            value={pricing.price}
                            onChange={(e) => handlePricingChange(index, 'price', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="outlined"
                            type="number"
                            inputProps={{ step: '0.01' }}
                            value={pricing.margin}
                            onChange={(e) => handlePricingChange(index, 'margin', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="outlined"
                            value={pricing.barcode}
                            onChange={(e) => handlePricingChange(index, 'barcode', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {index > 0 && (
                            <IconButton
                              color="error"
                              onClick={() => handleRemovePricing(index)}
                            >
                              <DeleteOutline />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" fullWidth type="submit">
                  {initialProduct ? 'Update Product' : 'Save'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Stock Batch Tab */}
        {activeTab === 'stock' && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch Number</TableCell>
                <TableCell>Batch Date</TableCell>
                <TableCell>Initial Qty</TableCell>
                <TableCell>Remaining Qty</TableCell>
                <TableCell>Received Cost</TableCell>
                <TableCell>Current Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.batchNumber}</TableCell>
                  <TableCell>{new Date(batch.batchDate.seconds * 1000).toLocaleDateString()}</TableCell>
                  <TableCell>{batch.initialQty}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      value={batch.remainingQty}
                      onChange={(e) => handleBatchChange(batch.id, 'remainingQty', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>{batch.receivedCost}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="number"
                      value={batch.currentCost}
                      onChange={(e) => handleBatchChange(batch.id, 'currentCost', e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" fullWidth onClick={handleFilterHistory}>
                  Load
                </Button>
              </Grid>
            </Grid>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Activity Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Quantity Change</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Updated By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(record.date.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>{record.activityType}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>{record.stock}</TableCell>
                    <TableCell>{record.price}</TableCell>
                    <TableCell>{record.updatedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Product Images Tab */}
        {activeTab === 'images' && (
          <Box mt={2}>
            <Button
              variant="outlined"
              startIcon={<UploadOutlined />}
              component="label"
            >
              Upload Product Image
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
              />
            </Button>
            {product.imageUrl && <img src={product.imageUrl} alt="Product" style={{ marginTop: 10, maxWidth: '100%' }} />}
          </Box>
        )}

        {/* More Info Tab */}
        {activeTab === 'info' && (
          <Box mt={2}>
            <Typography variant="body2">More product info...</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default AddEditProduct;
