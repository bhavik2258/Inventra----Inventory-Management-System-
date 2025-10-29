import { useState, useEffect } from 'react';
import { Package, Users, TrendingUp, AlertTriangle, Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  description?: string;
  lowStockThreshold?: number;
}

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  activeUsers: number;
  totalValue: number;
}

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    activeUsers: 0,
    totalValue: 0,
  });
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    stock: '',
    price: '',
    description: '',
    lowStockThreshold: '10',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [productsRes, statsRes] = await Promise.all([
        api.products.getAll(),
        api.admin.getDashboardStats(),
      ]);

      if (productsRes.success) {
        const formattedProducts = productsRes.data.map((p: any) => ({
          _id: p._id,
          id: p._id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          stock: p.stock,
          price: p.price,
          status: p.status,
          description: p.description,
          lowStockThreshold: p.lowStockThreshold,
        }));
        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      stock: '',
      price: '',
      description: '',
      lowStockThreshold: '10',
    });
    setOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: product.stock.toString(),
      price: product.price.toString(),
      description: product.description || '',
      lowStockThreshold: product.lowStockThreshold?.toString() || '10',
    });
    setOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await api.products.delete(productId);
      if (response.success) {
        toast.success('Product deleted successfully');
        fetchDashboardData();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        stock: parseInt(formData.stock),
        price: parseFloat(formData.price),
        description: formData.description,
        lowStockThreshold: parseInt(formData.lowStockThreshold),
      };

      let response;
      if (editingProduct) {
        response = await api.products.update(editingProduct._id || editingProduct.id!, productData);
      } else {
        response = await api.products.create(productData);
      }

      if (response.success) {
        toast.success(editingProduct ? 'Product updated successfully' : 'Product added successfully');
        setOpen(false);
        fetchDashboardData();
      } else {
        toast.error(response.error || 'Failed to save product');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with orange accent */}
      <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 p-6 rounded-lg border border-orange-100">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your entire inventory system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          trend=""
          trendUp
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          trend={stats.lowStockItems > 0 ? "Needs attention" : ""}
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers.toString()}
          icon={Users}
          trend=""
          trendUp
        />
        <StatsCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={TrendingUp}
          trend=""
          trendUp
        />
      </div>

      {/* Product Catalog */}
      <Card className="border-orange-100">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900">Product Catalog</CardTitle>
              <CardDescription className="text-gray-600">Manage your product inventory</CardDescription>
            </div>
            <Button 
              onClick={handleAddProduct}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-orange-300 focus-visible:ring-orange-500"
              />
            </div>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No products found. Add your first product!</p>
            </div>
          ) : (
            <div className="rounded-md border border-orange-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="text-right font-semibold">Stock</TableHead>
                    <TableHead className="text-right font-semibold">Price</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const productId = product._id || product.id || '';
                    return (
                      <TableRow key={productId}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-gray-600">{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">{product.stock}</TableCell>
                        <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              product.status === 'in-stock'
                                ? 'bg-green-100 text-green-800'
                                : product.status === 'low-stock'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {product.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditProduct(product)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteProduct(productId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the product details below' : 'Enter the product details below'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input 
                id="name" 
                placeholder="Enter product name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input 
                id="sku" 
                placeholder="Enter SKU" 
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                placeholder="Enter category" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  placeholder="0" 
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required 
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="0.00" 
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required 
                  min="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input 
                id="description" 
                placeholder="Enter description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input 
                id="lowStockThreshold" 
                type="number" 
                placeholder="10" 
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                required 
                min="1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
