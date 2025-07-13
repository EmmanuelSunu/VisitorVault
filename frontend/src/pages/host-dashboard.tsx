import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, BarChart3, Check, X, Eye, User, Camera, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoleTabs from "@/components/role-tabs";

interface VisitorRequest {
  id: number;
  f_name: string;
  l_name: string;
  email: string;
  phone: string;
  company?: string;
  purpose: string;
  visit_date: string;
  status: 'pending' | 'approved' | 'rejected';
  check_in_time?: string;
  check_out_time?: string;
  pic?: string;
  id_pic?: string;
  id_type: string;
  id_number: string;
  h_name: string;
  h_email: string;
  h_phone: string;
  notes?: string;
}

interface DashboardData {
  statistics: {
    pending_approvals_count: number;
    todays_visits_count: number;
    currently_checked_in: number;
    weekly_total: number;
  };
  lists: {
    pending_approvals: VisitorRequest[];
    todays_visits: VisitorRequest[];
  };
}

export default function HostDashboard() {
  const { isAuthenticated, isLoading: authLoading, api } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, type: string} | null>(null);
  const media_URL = import.meta.env.VITE_MEDIA_URL||'http://127.0.0.1:8000'

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Update visitor status mutation
  const updateVisitorMutation = useMutation({
    mutationFn: async ({ visitorId, status, notes }: { visitorId: number, status: string, notes?: string }) => {
      const response = await api.patch(`/visitor/${visitorId}`, { status, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Success',
        description: 'Visitor request updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update visitor status',
        variant: 'destructive',
      });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      const response = await api.post(`/visitor/${visitorId}/check-in`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Success',
        description: 'Visitor checked in successfully.',
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      const response = await api.post(`/visitor/${visitorId}/check-out`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Success',
        description: 'Visitor checked out successfully.',
      });
    },
  });

  const handleApprove = (id: number) => {
    updateVisitorMutation.mutate({ visitorId: id, status: 'approved' });
  };

  const handleReject = (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      updateVisitorMutation.mutate({ 
        visitorId: id, 
        status: 'rejected',
        notes: reason
      });
    }
  };

  const handleCheckIn = (id: number) => {
    checkInMutation.mutate(id);
  };

  const handleCheckOut = (id: number) => {
    checkOutMutation.mutate(id);
  };

  const handleViewDetails = (request: VisitorRequest) => {
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

  if (authLoading || dashboardLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = dashboardData?.statistics || {
    pending_approvals_count: 0,
    todays_visits_count: 0,
    currently_checked_in: 0,
    weekly_total: 0,
  };

  const pendingRequests = dashboardData?.lists?.pending_approvals || [];
  const todayRequests = dashboardData?.lists?.todays_visits || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <RoleTabs />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Manage visitor requests and today's schedule.</p>
            </div>
            {/* <Button variant="outline" onClick={() => api.post('/logout')} className="self-start md:self-auto">Logout</Button> */}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending_approvals_count}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todays_visits_count}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Currently Checked In</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.currently_checked_in}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.weekly_total}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Approvals */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No pending visitor requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(pendingRequests as VisitorRequest[]).map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{`${request.f_name} ${request.l_name}`}</h3>
                                  <p className="text-sm text-gray-600">{request.company || 'No company'}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="status-pending">
                                Pending
                              </Badge>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2" />
                                {request.email}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(request.visit_date).toLocaleDateString()}
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

            {/* Right Sidebar: Today's Schedule */}
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
                      {(todayRequests as VisitorRequest[]).map((request) => (
                        <div key={request.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${
                              request.status === 'approved' ? 'bg-blue-500' :
                              request.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                            }`}></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {`${request.f_name} ${request.l_name}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.check_in_time ? new Date(request.check_in_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : 'Not checked in'} - {request.purpose.substring(0, 30)}...
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
                          {request.status === 'approved' && !request.check_out_time && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => request.check_in_time ? handleCheckOut(request.id) : handleCheckIn(request.id)}
                            >
                              {request.check_in_time ? 'Check Out' : 'Check In'}
                            </Button>
                          )}
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
              {/* Visitor Basic Info */}
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {`${selectedRequest.f_name} ${selectedRequest.l_name}`}
                  </h3>
                  <p className="text-gray-600">{selectedRequest.company || 'No company'}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Email:</span> {selectedRequest.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Phone:</span> {selectedRequest.phone}
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
                      {selectedRequest.pic ? (
                        <img 
                          src={`${media_URL}/storage/${selectedRequest.pic}`}
                          alt="Visitor Photo" 
                          className="w-full h-32 sm:h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleViewPhoto(`${media_URL}/storage/${selectedRequest.pic}`, 'Visitor Photo')}
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-48 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">No photo</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700">ID Document</h5>
                    <div className="relative group">
                      {selectedRequest.id_pic ? (
                        <img 
                          src={`${media_URL}/storage/${selectedRequest.id_pic}`}
                          alt="ID Document" 
                          className="w-full h-32 sm:h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleViewPhoto(`${media_URL}/storage/${selectedRequest.id_pic}`, 'ID Document')}
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-48 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">No ID photo</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Host Information</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {selectedRequest.h_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {selectedRequest.h_email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {selectedRequest.h_phone}
                  </p>
                </div>
              </div>

              {/* Visit Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Visit Details</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Purpose:</span> {selectedRequest.purpose}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Visit Date:</span> {new Date(selectedRequest.visit_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ID Type:</span> {selectedRequest.id_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ID Number:</span> {selectedRequest.id_number}
                  </p>
                  {selectedRequest.notes && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {selectedRequest.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Photo View Modal */}
      <Dialog open={isPhotoModalOpen} onOpenChange={closePhotoModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.type}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative aspect-video">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.type}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
