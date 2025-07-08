import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import RoleTabs from "@/components/role-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, BarChart3, Check, X, Eye, User, CreditCard, Printer, Camera, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function HostDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [todayRequests, setTodayRequests] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, type: string} | null>(null);

  // Load requests from localStorage
  useEffect(() => {
    const loadRequests = () => {
      const all = JSON.parse(localStorage.getItem('visitRequests') || '[]');
      
      setPendingRequests(all.filter((r: any) => r.status === 'pending'));
      setTodayRequests(all.filter((r: any) => r.status !== 'pending'));
      setStats({
        pendingApprovals: all.filter((r: any) => r.status === 'pending').length,
        todaysVisitors: all.length,
        currentlyCheckedIn: 0,
        thisWeekTotal: all.length,
      });
      setRecentActivity(all.slice(0, 5));
    };
    loadRequests();
    window.addEventListener('storage', loadRequests);
    return () => window.removeEventListener('storage', loadRequests);
  }, []);

  const updateRequestStatus = (id: number, status: string, rejectionReason?: string) => {
    const all = JSON.parse(localStorage.getItem('visitRequests') || '[]');
    const updated = all.map((r: any) =>
      r.id === id ? { ...r, status, rejectionReason: rejectionReason || undefined } : r
    );
    localStorage.setItem('visitRequests', JSON.stringify(updated));
    setPendingRequests(updated.filter((r: any) => r.status === 'pending'));
    setTodayRequests(updated.filter((r: any) => r.status !== 'pending'));
    setRecentActivity(updated.slice(0, 5));
    setStats({
      pendingApprovals: updated.filter((r: any) => r.status === 'pending').length,
      todaysVisitors: updated.length,
      currentlyCheckedIn: 0,
      thisWeekTotal: updated.length,
    });
    toast({
      title: 'Success',
      description: 'Visitor request updated successfully.',
    });
  };

  const handleApprove = (id: number) => {
    const request = pendingRequests.find(r => r.id === id);
    if (request) {
      updateRequestStatus(id, 'approved');
      generatePDF(request, 'approved');
    }
  };

  const handleReject = (id: number) => {
    const request = pendingRequests.find(r => r.id === id);
    if (request) {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason) {
        updateRequestStatus(id, 'rejected', reason);
        generatePDF(request, 'rejected');
      }
    }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleViewPhoto = (photoUrl: string, type: string) => {
    setSelectedPhoto({ url: photoUrl, type });
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setSelectedPhoto(null);
  };

  const generatePDF = (request: any, type: 'approved' | 'rejected') => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const statusText = type === 'approved' ? 'APPROVED' : 'REJECTED';
      const statusColor = type === 'approved' ? '#059669' : '#dc2626';
      const statusBg = type === 'approved' ? '#d1fae5' : '#fee2e2';
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Visitor Request - ${statusText}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f9fafb;
              }
              .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 5px;
              }
              .document-title {
                font-size: 18px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 10px;
              }
              .section {
                margin-bottom: 25px;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
              }
              .info-item {
                margin-bottom: 15px;
              }
              .info-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
              }
              .info-value {
                font-size: 14px;
                color: #1f2937;
                font-weight: 500;
              }
              .full-width {
                grid-column: 1 / -1;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }
              .timestamp {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 10px;
              }
              .photo-section {
                display: flex;
                gap: 32px;
                margin: 30px 0;
                justify-content: center;
              }
              .photo-box {
                flex: 1;
                min-width: 180px;
                max-width: 240px;
                text-align: center;
              }
              .photo-box img {
                width: 100%;
                max-width: 220px;
                max-height: 180px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                object-fit: contain;
                background: #f3f4f6;
                margin-bottom: 8px;
              }
              .photo-label {
                font-size: 13px;
                color: #374151;
                font-weight: 500;
                margin-bottom: 2px;
              }
              @media print {
                body { margin: 0; padding: 0; background: white; }
                .container { box-shadow: none; border: 1px solid #e5e7eb; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="company-name"> Desiderata Visitor Management System</div>
                <div class="document-title">Visitor Request Report</div>
                <div class="status-badge" style="background: ${statusBg}; color: ${statusColor};">
                  ${statusText}
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Visitor Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${request.visitor.name}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Company</div>
                    <div class="info-value">${request.visitor.company || 'Not specified'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${request.visitor.email}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${request.visitor.phone}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Badge Number</div>
                    <div class="info-value">${request.visitor.badgeNumber}</div>
                  </div>
                </div>
              </div>
              <div class="photo-section">
                <div class="photo-box">
                  <div class="photo-label">Visitor Photo</div>
                  ${request.visitor.photoUrl ? `<img src="${request.visitor.photoUrl}" alt="Visitor Photo" />` : '<div style="color:#9ca3af; font-size:12px; padding:40px 0; background:#f3f4f6; border-radius:8px;">No photo</div>'}
                </div>
                <div class="photo-box">
                  <div class="photo-label">ID Document</div>
                  ${request.idPhoto ? `<img src="${request.idPhoto}" alt="ID Document" />` : '<div style="color:#9ca3af; font-size:12px; padding:40px 0; background:#f3f4f6; border-radius:8px;">No ID photo</div>'}
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Visit Details</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Visit Date</div>
                    <div class="info-value">${request.visitDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Time</div>
                    <div class="info-value">${request.startTime} - ${request.endTime}</div>
                  </div>
                  <div class="info-item full-width">
                    <div class="info-label">Purpose of Visit</div>
                    <div class="info-value">${request.purpose}</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Host/Reception Contact</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${request.hostName || 'Not specified'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${request.hostEmail || 'Not specified'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${request.hostPhone || 'Not specified'}</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Request Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Request ID</div>
                    <div class="info-value">${request.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">${request.status}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Requested On</div>
                    <div class="info-value">${new Date(request.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Processed On</div>
                    <div class="info-value">${new Date().toLocaleDateString()}</div>
                  </div>
                  ${request.rejectionReason ? `
                  <div class="info-item full-width">
                    <div class="info-label">Rejection Reason</div>
                    <div class="info-value">${request.rejectionReason}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="footer">
                <div>This document was generated by Desiderata Visitor Management System</div>
                <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <RoleTabs />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, Host User
              </h1>
              <p className="text-gray-600">Manage visitor requests and today's schedule.</p>
            </div>
            <Button variant="outline" onClick={logout} className="self-start md:self-auto">Logout</Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todaysVisitors || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Currently Checked In</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.currentlyCheckedIn || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Week Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.thisWeekTotal || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Visitor Requests (spans 2 columns on desktop) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Visitor Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No pending visitor requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{request.visitor.name}</h3>
                                  <p className="text-sm text-gray-600">{request.visitor.company || 'No company'}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="status-pending">
                                Pending
                              </Badge>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2" />
                                {request.visitor.email}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {request.visitDate}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                <strong>Purpose:</strong> {request.purpose}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(request)}
                                className="flex-1 sm:flex-none"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                className="flex-1 sm:flex-none"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                className="flex-1 sm:flex-none"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar: Today's Schedule + Recent Activity */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {todayRequests.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No visits scheduled for today</p>
                  ) : (
                    <div className="space-y-4">
                      {todayRequests.map((request: any) => (
                        <div key={request.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${
                              request.status === 'approved' ? 'bg-blue-500' :
                              request.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                            }`}></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {request.visitor.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.visitDate).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {request.purpose.substring(0, 30)}...
                            </p>
                            <Badge 
                              className={`mt-1 ${
                                request.status === 'approved' ? 'status-approved' :
                                request.status === 'rejected' ? 'status-rejected' :
                                'status-pending'
                              }`}
                            >
                              {request.status === 'approved' ? 'Approved' :
                               request.status === 'rejected' ? 'Rejected' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {activity.status === 'approved' && <Check className="h-4 w-4 text-blue-500" />}
                            {activity.status === 'rejected' && <X className="h-4 w-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{activity.purpose}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {selectedRequest && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Visitor Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Visitor Photo and Basic Info */}
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {selectedRequest.visitor.name}
                  </h3>
                  <p className="text-gray-600">{selectedRequest.visitor.company}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Email:</span> {selectedRequest.visitor.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Phone:</span> {selectedRequest.visitor.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Camera className="mr-2 h-4 w-4" />
                  Photos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700">Visitor Photo</h5>
                    <div className="relative group">
                      {selectedRequest.visitor.photoUrl ? (
                        <img 
                          src={selectedRequest.visitor.photoUrl} 
                          alt="Visitor Photo" 
                          className="w-full h-32 sm:h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleViewPhoto(selectedRequest.visitor.photoUrl, 'Visitor Photo')}
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-48 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">No photo</div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">Click to view larger</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700">ID Document</h5>
                    <div className="relative group">
                      {selectedRequest.idPhoto ? (
                        <img 
                          src={selectedRequest.idPhoto} 
                          alt="ID Document" 
                          className="w-full h-32 sm:h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleViewPhoto(selectedRequest.idPhoto, 'ID Document')}
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-48 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">No ID photo</div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">Click to view larger</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Visit Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Visit Date</p>
                    <p className="font-medium">{selectedRequest.visitDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-500">Purpose of Visit</p>
                    <p className="font-medium">{selectedRequest.purpose}</p>
                  </div>
                </div>
              </div>

              {/* ID Information */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Identification Details
                </h4>
                <div className="text-sm text-gray-700">
                  {selectedRequest.notes}
                </div>
              </div>

              {/* Host/Reception Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Host/Reception Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedRequest.hostName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedRequest.hostEmail || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedRequest.hostPhone || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Request Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Request Status
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={`mt-1 ${
                      selectedRequest.status === 'approved' ? 'status-approved' :
                      selectedRequest.status === 'rejected' ? 'status-rejected' :
                      'status-pending'
                    }`}>
                      {selectedRequest.status === 'approved' ? 'Approved' :
                       selectedRequest.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Requested On</p>
                    <p className="font-medium text-sm">
                      {new Date(selectedRequest.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedRequest.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {selectedRequest.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Rejection Reason:</span> {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setIsDetailsModalOpen(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve Request
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setIsDetailsModalOpen(false);
                    }}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" /> Reject Request
                  </Button>
                </div>
              )}
              
              {/* Print Buttons for Processed Requests */}
              {selectedRequest.status !== 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={() => generatePDF(selectedRequest, selectedRequest.status as 'approved' | 'rejected')}
                    className="flex-1"
                    variant="outline"
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print Report
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Photo View Modal */}
      {selectedPhoto && (
        <Dialog open={isPhotoModalOpen} onOpenChange={(open) => { if (!open) closePhotoModal(); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center text-lg sm:text-xl">
                <Camera className="mr-2 h-5 w-5" />
                {selectedPhoto.type}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex justify-center my-4">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.type}
                className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg border shadow-sm"
              />
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={closePhotoModal} variant="outline" className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
