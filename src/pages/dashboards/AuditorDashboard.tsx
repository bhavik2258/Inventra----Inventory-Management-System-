import { useEffect, useState, useCallback } from 'react';
import { FileText, CheckCircle, Download, Calendar, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface AuditReport {
  id: string;
  title: string;
  date: string;
  status: string;
  discrepancies: number;
}

interface AuditDetail {
  _id: string;
  title: string;
  date: string;
  status: string;
  discrepancies: number;
  discrepancyDetails: Array<{
    productId: any;
    productName: string;
    sku: string;
    currentStock: number;
    status: string;
    discrepancies: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
  }>;
  notes: string;
  createdBy: {
    fullName: string;
    email: string;
  };
}

interface DashboardStats {
  totalAudits: number;
  completedAudits: number;
  inProgressAudits: number;
  totalDiscrepancies: number;
  totalProducts: number;
}

export function AuditorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAudits: 0,
    completedAudits: 0,
    inProgressAudits: 0,
    totalDiscrepancies: 0,
    totalProducts: 0,
  });
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [auditTitle, setAuditTitle] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditDetail | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        api.auditor.getDashboardStats(),
        api.auditor.getAuditReports(),
      ]);

      setStats(statsData.data);
      setAuditReports(reportsData.data);
    } catch (error: any) {
      console.error('Error fetching audit data:', error);
      toast.error(error.message || 'Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewAudit = async () => {
    try {
      const response = await api.auditor.createNewAudit();
      toast.success(response.message || 'New audit started successfully', {
        description: `${response.data.totalDiscrepancies} discrepancies found.`,
      });
      fetchData(); // Refresh data after audit
    } catch (error: any) {
      toast.error(error.message || 'Failed to perform audit');
    }
  };

  const handleScheduleAudit = () => {
    setScheduleModalOpen(true);
  };

  const handleScheduleAuditSubmit = async () => {
    if (!auditTitle || !auditDate) {
      toast.error('Please provide both title and date');
      return;
    }

    try {
      const response = await api.auditor.scheduleAudit(auditTitle, auditDate);
      toast.success(response.message || 'Audit scheduled successfully');
      setScheduleModalOpen(false);
      setAuditTitle('');
      setAuditDate('');
      fetchData(); // Refresh data after scheduling
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule audit');
    }
  };

  const handleExportReports = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/auditor/exportReport?format=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export report');
    }
  };

  const handleViewReport = async (reportId: string, reportTitle: string) => {
    try {
      const response = await api.auditor.getAuditById(reportId);
      setSelectedAudit(response.data);
      setDetailsModalOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch audit details');
    }
  };

  const handleCompleteAudit = async (auditId: string) => {
    try {
      const response = await api.auditor.completeAudit(auditId);
      toast.success(response.message || 'Audit marked as completed successfully');
      setDetailsModalOpen(false);
      setSelectedAudit(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete audit');
    }
  };

  const handleDownloadReport = (reportId: string, reportTitle: string) => {
    toast.success(`Downloading report: ${reportTitle}`);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Auditor Dashboard</h1>
          <p className="text-muted-foreground">Review and audit inventory records</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const completionRate = stats.totalAudits > 0 
    ? Math.round((stats.completedAudits / stats.totalAudits) * 100) 
    : 0;

  const errorRate = stats.totalProducts > 0 
    ? ((stats.totalDiscrepancies / stats.totalProducts) * 100).toFixed(2) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Auditor Dashboard</h1>
        <p className="text-muted-foreground">Review and audit inventory records</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Audits"
          value={stats.totalAudits.toString()}
          icon={FileText}
          trend="This quarter"
        />
        <StatsCard
          title="Completed"
          value={stats.completedAudits.toString()}
          icon={CheckCircle}
          trend={`${completionRate}% completion rate`}
          trendUp={completionRate > 50}
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgressAudits.toString()}
          icon={Calendar}
        />
        <StatsCard
          title="Discrepancies Found"
          value={stats.totalDiscrepancies.toString()}
          icon={FileText}
          trend={`${errorRate}% error rate`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button 
          size="lg" 
          className="h-24 bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 hover:scale-105" 
          onClick={handleNewAudit}
        >
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-6 w-6" />
            <span>New Audit</span>
          </div>
        </Button>
        <Button 
          size="lg" 
          className="h-24 bg-white hover:bg-gray-50 border-2 border-orange-500 text-orange-600 hover:text-orange-700" 
          onClick={handleScheduleAudit}
        >
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-6 w-6" />
            <span>Schedule Audit</span>
          </div>
        </Button>
        <Button 
          size="lg" 
          className="h-24 bg-white hover:bg-gray-50 border-2 border-orange-500 text-orange-600 hover:text-orange-700" 
          onClick={handleExportReports}
        >
          <div className="flex flex-col items-center gap-2">
            <Download className="h-6 w-6" />
            <span>Export Reports</span>
          </div>
        </Button>
      </div>

      {/* Audit Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>Recent inventory audits and their status</CardDescription>
            </div>
            <Button variant="outline" onClick={() => toast.info('Opening audit history')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {auditReports.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No audit reports available at the moment.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audit Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Discrepancies</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.status === 'completed'
                              ? 'default'
                              : report.status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {report.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.discrepancies > 0 ? (
                          <Badge variant="destructive">{report.discrepancies}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewReport(report.id, report.title)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {report.status === 'completed' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadReport(report.id, report.title)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Schedule Audit Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Audit</DialogTitle>
            <DialogDescription>
              Enter the audit title and select a date for the scheduled audit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="audit-title">Audit Title</Label>
              <Input
                id="audit-title"
                placeholder="e.g., Weekly Inventory Audit"
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-date">Audit Date</Label>
              <Input
                id="audit-date"
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleAuditSubmit} className="bg-orange-500 hover:bg-orange-600">
              Schedule Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Audit Details</DialogTitle>
            <DialogDescription>
              Review audit findings and discrepancies
            </DialogDescription>
          </DialogHeader>
          {selectedAudit && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Audit Info */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Audit Title</Label>
                    <Badge variant={selectedAudit.status === 'completed' ? 'default' : selectedAudit.status === 'in-progress' ? 'secondary' : 'outline'}>
                      {selectedAudit.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm">{selectedAudit.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Label className="text-xs text-muted-foreground">Date: {new Date(selectedAudit.date).toLocaleDateString()}</Label>
                    <Label className="text-xs text-muted-foreground">Created by: {selectedAudit.createdBy?.fullName || 'Unknown'}</Label>
                  </div>
                </div>

                {/* Discrepancies Summary */}
                {selectedAudit.discrepancies > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Discrepancies Found</AlertTitle>
                    <AlertDescription>
                      {selectedAudit.discrepancies} discrepancy(ies) detected in this audit
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>No Discrepancies</AlertTitle>
                    <AlertDescription>
                      All products passed the audit checks
                    </AlertDescription>
                  </Alert>
                )}

                {/* Discrepancy Details */}
                {selectedAudit.discrepancyDetails && selectedAudit.discrepancyDetails.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-semibold">Detailed Findings</Label>
                    {selectedAudit.discrepancyDetails.map((detail, index) => (
                      <Card key={index} className="border-orange-200">
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{detail.productName}</h4>
                              <Badge variant="outline">{detail.sku}</Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Stock: {detail.currentStock}</span>
                              <span>Status: {detail.status}</span>
                            </div>
                            <div className="space-y-1 mt-3">
                              {detail.discrepancies.map((disc, discIndex) => (
                                <div key={discIndex} className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                                  <div className="flex-1">
                                    <Badge 
                                      variant={
                                        disc.severity === 'high' ? 'destructive' : 
                                        disc.severity === 'medium' ? 'secondary' : 
                                        'outline'
                                      }
                                      className="mr-2"
                                    >
                                      {disc.severity}
                                    </Badge>
                                    <span className="text-sm">{disc.message}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {selectedAudit.notes && (
                  <div className="grid gap-2">
                    <Label className="font-semibold">Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedAudit.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
            {selectedAudit && selectedAudit.status !== 'completed' && (
              <Button 
                onClick={() => handleCompleteAudit(selectedAudit._id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
