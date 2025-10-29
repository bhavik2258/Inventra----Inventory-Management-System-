import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Package, ShoppingCart, Download } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  category?: string;
  status?: string;
}

interface PendingOrder {
  id: string;
  orderNo: string;
  productName: string;
  sku: string;
  customer: string;
  quantity: number;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  lowStockItems: number;
  pendingOrders: number;
  totalProducts: number;
  outOfStock: number;
}

export function ClerkDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    lowStockItems: 0,
    pendingOrders: 0,
    totalProducts: 0,
    outOfStock: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsData, lowStockData, ordersData] = await Promise.all([
        api.clerk.getDashboardStats(),
        api.clerk.getLowStockProducts(),
        api.clerk.getPendingOrders('pending'),
      ]);

      setStats(statsData.data);
      setLowStockProducts(lowStockData.data);
      setPendingOrders(ordersData.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleReorder = async (productId: string, productName: string) => {
    try {
      await api.clerk.requestReorder(productId);
      toast.success(`Reorder request sent for ${productName}`, {
        description: 'Manager will be notified to restock this item.',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to create reorder request');
    }
  };

  const handleProcessOrder = async (orderId: string, status: string) => {
    try {
      await api.clerk.updateOrderStatus(orderId, status);
      toast.success(`Order status updated to ${status}`);
      fetchData(); // Refresh data after status update
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      const csvContent = [
        ['Product Name', 'SKU', 'Current Stock', 'Reorder Level', 'Status'].join(','),
        ...lowStockProducts.map((product) =>
          [
            `"${product.name}"`,
            product.sku,
            product.stock,
            product.reorderLevel,
            product.status || 'low-stock',
          ].join(',')
        ),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `low-stock-alerts-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Low stock report exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Clerk Dashboard</h1>
          <p className="text-muted-foreground">Monitor stock levels and process orders</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Clerk Dashboard</h1>
        <p className="text-muted-foreground">Monitor stock levels and process orders</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          trend={stats.lowStockItems > 0 ? 'Needs attention' : 'All good'}
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          icon={ShoppingCart}
          trend="Requires processing"
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
        />
      </div>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Alerts
                {refreshing && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Refreshing...
                  </span>
                )}
              </CardTitle>
              <CardDescription>Products that need reordering</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={lowStockProducts.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No low stock items at the moment.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={product.stock === 0 ? 'destructive' : 'secondary'}
                        >
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{product.reorderLevel}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleReorder(product.id, product.name)}
                          className="bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Orders</CardTitle>
          <CardDescription>Orders waiting to be processed</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No pending orders at the moment.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNo}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.productName}</span>
                          <span className="text-xs text-muted-foreground">{order.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-right">{order.quantity}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.status === 'pending' 
                              ? 'secondary' 
                              : order.status === 'completed'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcessOrder(order.id, 'completed')}
                            className="bg-green-500 hover:bg-green-600 text-white transition-all duration-200 hover:scale-105"
                          >
                            Complete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}