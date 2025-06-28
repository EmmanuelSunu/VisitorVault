import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import Header from "@/components/header";
import RoleTabs from "@/components/role-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, BarChart3, Check, X, Eye } from "lucide-react";

export default function HostDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  // Fetch pending visitor requests
  const { data: pendingRequests = [], isLoading: loadingPending } = useQuery({
    queryKey: ["/api/visit-requests/pending"],
    enabled: isAuthenticated,
  });

  // Fetch today's schedule
  const { data: todayRequests = [], isLoading: loadingToday } = useQuery({
    queryKey: ["/api/visit-requests/today"],
    enabled: isAuthenticated,
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["/api/activity"],
    enabled: isAuthenticated,
  });

  // Approval/rejection mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      const data: any = { status };
      if (rejectionReason) {
        data.rejectionReason = rejectionReason;
      }
      await apiRequest("PATCH", `/api/visit-requests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Visitor request updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateRequestMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      updateRequestMutation.mutate({ id, status: "rejected", rejectionReason: reason });
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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-600">Manage your visitor requests and today's schedule.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.pendingApprovals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Visitors</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.todaysVisitors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Currently Checked In</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.currentlyCheckedIn || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.thisWeekTotal || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Visitors List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Visitor Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading pending requests...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending visitor requests</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {pendingRequests.map((request: any) => (
                      <div key={request.id} className="py-6">
                        <div className="flex items-start space-x-4">
                          {request.visitor.photoUrl && (
                            <img
                              src={request.visitor.photoUrl}
                              alt="Visitor Photo"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  {request.visitor.firstName} {request.visitor.lastName}
                                </h3>
                                <p className="text-sm text-gray-500">{request.visitor.company}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Requested: {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className="status-pending">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{request.purpose}</p>
                            <div className="flex items-center space-x-4 mt-4">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                disabled={updateRequestMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-1 h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={updateRequestMutation.isPending}
                              >
                                <X className="mr-1 h-3 w-3" /> Reject
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Eye className="mr-1 h-3 w-3" /> View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingToday ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : todayRequests.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No visits scheduled for today</p>
                ) : (
                  <div className="space-y-4">
                    {todayRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${
                            request.checkedInAt ? 'bg-green-500' : 
                            request.status === 'approved' ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {request.visitor.firstName} {request.visitor.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.visitDate).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {request.purpose.substring(0, 30)}...
                          </p>
                          <Badge 
                            size="sm" 
                            className={`mt-1 ${
                              request.checkedInAt ? 'status-checked-in' :
                              request.status === 'approved' ? 'status-approved' :
                              request.status === 'rejected' ? 'status-rejected' :
                              'status-pending'
                            }`}
                          >
                            {request.checkedInAt ? 'Checked In' : 
                             request.status === 'approved' ? 'Approved' :
                             request.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
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
                          {activity.action === 'check_in' && <Check className="h-4 w-4 text-green-500" />}
                          {activity.action === 'check_out' && <X className="h-4 w-4 text-gray-500" />}
                          {activity.action === 'approved' && <Check className="h-4 w-4 text-blue-500" />}
                          {activity.action === 'rejected' && <X className="h-4 w-4 text-red-500" />}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.notes || activity.action}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
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
      </main>
    </div>
  );
}
