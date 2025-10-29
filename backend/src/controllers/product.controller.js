import Product from '../models/Product.js';

export const getAllProducts = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).populate('addedBy', 'fullName email');
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products'
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('addedBy', 'fullName email');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch product'
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, sku, category, stock, price, description, lowStockThreshold } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this SKU already exists'
      });
    }

    // Only add addedBy if it's a valid MongoDB ObjectId
    const productData = {
      name,
      sku,
      category,
      stock,
      price,
      description,
      lowStockThreshold
    };

    // Check if userId is a valid ObjectId (not hardcoded admin)
    if (req.user.userId && req.user.userId !== 'admin-hardcoded' && /^[0-9a-fA-F]{24}$/.test(req.user.userId)) {
      productData.addedBy = req.user.userId;
    }

    const product = await Product.create(productData);

    // Only populate if addedBy exists and is a valid ObjectId
    let populatedProduct = product;
    if (product.addedBy) {
      populatedProduct = await Product.findById(product._id).populate('addedBy', 'fullName email');
    }

    res.status(201).json({
      success: true,
      data: populatedProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create product'
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, category, stock, price, description, lowStockThreshold } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, stock, price, description, lowStockThreshold },
      { new: true, runValidators: true }
    ).populate('addedBy', 'fullName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update product'
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete product'
    });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      status: { $in: ['low-stock', 'out-of-stock'] } 
    }).populate('addedBy', 'fullName email');
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch low stock products'
    });
  }
};
