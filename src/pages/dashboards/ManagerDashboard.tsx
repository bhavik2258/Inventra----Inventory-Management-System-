import { useState, useEffect } from 'react';
import { Package, TrendingDown, TrendingUp, FileText, Search } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  product: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  reference: string;
  previousStock: number;
  newStock: number;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  status: string;
  lowStockThreshold: number;
}

interface StockStats {
  stockInToday: number;
  stockOutToday: number;
  pendingValidations: number;
  reportsGenerated: number;
}

export function ManagerDashboard() {
  const [stats, setStats] = useState<StockStats>({
    stockInToday: 0,
    stockOutToday: 0,
    pendingValidations: 0,
    reportsGenerated: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  
  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [reportType, setReportType] = useState('inventory');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = transactions.filter(t => 
        t.product.toLowerCase().includes(query) ||
        t.reference.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query)
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions
      const transactionRes = await api.manager.getTransactions({ limit: 50 });
      const recentTransactions = transactionRes.data || [];
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = recentTransactions.filter((t: any) => {
        const tDate = new Date(t.createdAt);
        tDate.setHours(0, 0, 0, 0);
        return tDate.getTime() === today.getTime();
      });
      
      const stockInToday = todayTransactions
        .filter((t: any) => t.type === 'in')
        .reduce((sum: number, t: any) => sum + t.quantity, 0);
      
      const stockOutToday = todayTransactions
        .filter((t: any) => t.type === 'out')
        .reduce((sum: number, t: any) => sum + t.quantity, 0);
      
      // Fetch products for validation
      const productsRes = await api.products.getAll();
      const allProducts = productsRes.data || [];
      
      const pendingValidations = allProducts.filter((p: Product) => 
        p.stock <= p.lowStockThreshold
      ).length;
      
      // Load reports generated count from localStorage
      const savedReportsGenerated = parseInt(localStorage.getItem('reportsGenerated') || '0', 10);
      
      setStats({
        stockInToday,
        stockOutToday,
        pendingValidations,
        reportsGenerated: savedReportsGenerated
      });
      
      // Format transactions for display
      const formattedTransactions: Transaction[] = recentTransactions.slice(0, 10).map((t: any) => ({
        id: t._id,
        product: t.product?.name || 'Unknown Product',
        type: t.type,
        quantity: t.quantity,
        date: new Date(t.createdAt).toLocaleDateString(),
        reference: t.reference || 'N/A',
        previousStock: t.previousStock,
        newStock: t.newStock
      }));
      
      setTransactions(formattedTransactions);
      setFilteredTransactions(formattedTransactions);
      setProducts(allProducts);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleStockIn = async () => {
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) {
      toast.error('Please select a product and enter a valid quantity');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.manager.stockIn(
        selectedProductId,
        parseInt(quantity),
        reference || undefined
      );
      
      toast.success(response.message || 'Stock added successfully');
      setStockInOpen(false);
      setSelectedProductId('');
      setQuantity('');
      setReference('');
      await loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add stock');
    } finally {
      setProcessing(false);
    }
  };

  const handleStockOut = async () => {
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) {
      toast.error('Please select a product and enter a valid quantity');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.manager.stockOut(
        selectedProductId,
        parseInt(quantity),
        reference || undefined
      );
      
      toast.success(response.message || 'Stock removed successfully');
      setStockOutOpen(false);
      setSelectedProductId('');
      setQuantity('');
      setReference('');
      await loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove stock');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setProcessing(true);
      const response = await api.manager.generateReport(reportType);
      
      // Download as JSON
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-report-${reportType}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Increment reports generated counter
      const currentCount = parseInt(localStorage.getItem('reportsGenerated') || '0', 10);
      const newCount = currentCount + 1;
      localStorage.setItem('reportsGenerated', newCount.toString());
      
      // Update the stats state
      setStats(prev => ({ ...prev, reportsGenerated: newCount }));
      
      toast.success(`Report generated successfully (${reportType})`);
      setReportOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setProcessing(false);
    }
  };

  const getProductInfo = (productId: string) => {
    return products.find(p => p._id === productId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Monitor stock movements and generate reports</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Stock In (Today)"
          value={loading ? '...' : stats.stockInToday.toString()}
          icon={TrendingUp}
          trend="Today's stock additions"
          trendUp
        />
        <StatsCard
          title="Stock Out (Today)"
          value={loading ? '...' : stats.stockOutToday.toString()}
          icon={TrendingDown}
          trend="Today's stock removals"
        />
        <StatsCard
          title="Pending Validations"
          value={loading ? '...' : stats.pendingValidations.toString()}
          icon={Package}
        />
        <StatsCard
          title="Reports Generated"
          value={loading ? '...' : stats.reportsGenerated.toString()}
          icon={FileText}
          trend="This month"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button 
          size="lg" 
          className="h-24 bg-orange-600 hover:bg-orange-700"
          onClick={() => setStockInOpen(true)}
        >
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <span>Stock In</span>
          </div>
        </Button>
        <Button 
          size="lg" 
          className="h-24 border-orange-600 text-orange-600 hover:bg-orange-50" 
          variant="outline"
          onClick={() => setStockOutOpen(true)}
        >
          <div className="flex flex-col items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            <span>Stock Out</span>
          </div>
        </Button>
        <Button 
          size="lg" 
          className="h-24 border-orange-600 text-orange-600 hover:bg-orange-50" 
          variant="outline"
          onClick={() => setReportOpen(true)}
        >
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-6 w-6" />
            <span>Generate Report</span>
          </div>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest stock movements</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions by product, type, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-orange-300 focus-visible:ring-orange-500"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No transactions found matching your search.' : 'No transactions yet'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.product}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'in' ? 'default' : 'secondary'}>
                          {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{transaction.quantity}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className="text-muted-foreground">{transaction.reference}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {transaction.previousStock} → {transaction.newStock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock In Modal */}
      <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Stock In</DialogTitle>
            <DialogDescription>
              Add stock to a product. This will increase the current inventory level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name} ({product.sku}) - Current: {product.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="PO-1234, Order ID, etc."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            {selectedProductId && getProductInfo(selectedProductId) && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Current Stock:</strong> {getProductInfo(selectedProductId)?.stock}
                </p>
                {quantity && !isNaN(parseInt(quantity)) && (
                  <p className="text-sm text-gray-600">
                    <strong>New Stock:</strong> {(getProductInfo(selectedProductId)?.stock || 0) + parseInt(quantity)}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockInOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockIn} disabled={processing || !selectedProductId || !quantity}>
              {processing ? 'Processing...' : 'Confirm Stock In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Out Modal */}
      <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Stock Out</DialogTitle>
            <DialogDescription>
              Remove stock from a product. This will decrease the current inventory level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-out">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name} ({product.sku}) - Current: {product.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity-out">Quantity</Label>
              <Input
                id="quantity-out"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference-out">Reference (Optional)</Label>
              <Input
                id="reference-out"
                placeholder="SO-5678, Order ID, etc."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            {selectedProductId && getProductInfo(selectedProductId) && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Current Stock:</strong> {getProductInfo(selectedProductId)?.stock}
                </p>
                {quantity && !isNaN(parseInt(quantity)) && (
                  <p className="text-sm text-gray-600">
                    <strong>New Stock:</strong> {Math.max(0, (getProductInfo(selectedProductId)?.stock || 0) - parseInt(quantity))}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockOut} disabled={processing || !selectedProductId || !quantity}>
              {processing ? 'Processing...' : 'Confirm Stock Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Report Modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Generate inventory reports in JSON format for analysis and record-keeping.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="transactions">Transaction History</SelectItem>
                  <SelectItem value="lowStock">Low Stock Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Report Type:</strong> {reportType === 'inventory' && 'Complete inventory status with all products and recent transactions'}
                {reportType === 'transactions' && 'Complete transaction history with full details'}
                {reportType === 'lowStock' && 'Products with low stock that need attention'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processing ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
