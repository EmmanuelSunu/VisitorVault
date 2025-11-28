import { useState } from "react";
import { useQuery, useMutation, UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import Header from "@/components/header";
import RoleTabs from "@/components/role-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Search, UserCheck, UserX, AlertTriangle, FileOutput, Camera, Building, Check, X } from "lucide-react";

interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
}

interface Visitor {
  id: number;
  firstName: string;
  lastName: string;
  company: string;
  badgeNumber: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  visitRequests: VisitRequest[];
}

interface VisitRequest {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out';
  checkedInAt?: string;
  checkedOutAt?: string;
  duration: string;
  host: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface CheckedInVisitor {
  id: number;
  visitor: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
  host: {
    firstName: string;
    lastName: string;
  };
  checkedInAt: string;
  duration: string;
}

export default function ReceptionInterface() {
  const { user, isAuthenticated, isLoading, api } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [manualBadgeNumber, setManualBadgeNumber] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch currently checked in visitors
  const { data: checkedInVisitors = [], isLoading: loadingCheckedIn } = useQuery<CheckedInVisitor[]>({
    queryKey: ["/api/visits/checked-in"],
    queryFn: async () => {
      const response = await api.get("/visits/checked-in");
      return response.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Search visitors query
  const [currentPage, setCurrentPage] = useState(1);
  const searchQueryResult: UseQueryResult<PaginatedResponse<Visitor>, Error> = useQuery({
    queryKey: ["/api/visitors/search", searchQuery, currentPage] as const,
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (currentPage > 1) params.append('page', currentPage.toString());
        const queryString = params.toString();
        console.log('Making request to:', `/visitors/search${queryString ? `?${queryString}` : ''}`); // Debug log
                  const response = await api.get(`/visitors/search${queryString ? `?${queryString}` : ''}`);
          console.log('Search response:', response.data); // Debug log
          // Convert array response to paginated format
          return {
            data: Array.isArray(response.data) ? response.data : [],
            total: Array.isArray(response.data) ? response.data.length : 0,
            current_page: 1,
            last_page: 1,
            per_page: Array.isArray(response.data) ? response.data.length : 10
          };
      } catch (error) {
        console.error('Search error:', error); // Debug log
        throw error;
      }
    },
    enabled: true, // Always enable the query to show all visitors by default
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const { data: searchResults, isLoading: isSearching } = searchQueryResult;

  // Handle successful search results
  useEffect(() => {
    const firstVisitor = searchResults?.data?.[0];
    if (firstVisitor && !selectedVisitor) {
      setSelectedVisitor(firstVisitor);
    }
  }, [searchResults, selectedVisitor]);

  // Handle search errors
  useEffect(() => {
    if (searchQueryResult.error) {
      const error = searchQueryResult.error as any;
      console.error('Search query error:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }

      toast({
        title: "Search Failed",
        description: error.response?.data?.message || error.message || "Failed to search visitors",
        variant: "destructive",
      });
    }
  }, [searchQueryResult.error, toast]);

  // Badge lookup mutation
  const badgeLookupMutation = useMutation({
    mutationFn: async (badgeNumber: string) => {
      const response = await api.get(`/visitors/badge/${badgeNumber}`);
      return response.data;
    },
    onSuccess: (visitor: Visitor) => {
      setSelectedVisitor(visitor);
      setManualBadgeNumber("");
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Visitor Not Found",
        description: "No visitor found with that badge number.",
        variant: "destructive",
      });
    },
  });

  // Check in/out mutation
  const checkInOutMutation = useMutation({
    mutationFn: async ({ visitorId, action }: { visitorId: number; action: 'check-in' | 'check-out' }) => {
      const endpoint = action === 'check-in' ? '/visits/check-in-visitor' : '/visits/check-out-visitor';
      const response = await api.post(endpoint, { visitor_id: visitorId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits/checked-in"] });
      setSelectedVisitor(null);
      setSearchQuery("");
      toast({
        title: "Success",
        description: "Visitor status updated successfully.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update visitor status",
        variant: "destructive",
      });
    },
  });

  // Approve/unapprove visitor mutation
  const approveVisitorMutation = useMutation({
    mutationFn: async ({ visitorId, status, notes }: { visitorId: number; status: string; notes?: string }) => {
      const response = await api.patch(`/visitor/${visitorId}`, { status, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits/checked-in"] });
      setSelectedVisitor(null);
      setSearchQuery("");
      toast({
        title: "Success",
        description: "Visitor status updated successfully.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update visitor status",
        variant: "destructive",
      });
    },
  });

  // Emergency checkout all mutation
  const emergencyCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/visits/emergency-checkout-all');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits/checked-in"] });
      toast({
        title: "Emergency Checkout Complete",
        description: data.message,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to perform emergency checkout",
        variant: "destructive",
      });
    },
  });

  // Export today's report mutation
  const exportReportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/visits/export-today-report');
      return response.data;
    },
    onSuccess: (data) => {
      // Create and download CSV file
      const csvContent = generateCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitor-report-${data.date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Today's visitor report has been downloaded.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to export report",
        variant: "destructive",
      });
    },
  });

  const handleBadgeLookup = () => {
    if (manualBadgeNumber.trim()) {
      badgeLookupMutation.mutate(manualBadgeNumber.trim());
    }
  };

  const handleCheckIn = () => {
    if (selectedVisitor?.id) {
      checkInOutMutation.mutate({
        visitorId: selectedVisitor.id,
        action: 'check-in'
      });
    }
  };

  const handleCheckOut = () => {
    if (selectedVisitor?.id) {
      checkInOutMutation.mutate({
        visitorId: selectedVisitor.id,
        action: 'check-out'
      });
    }
  };

  const handleApprove = () => {
    if (selectedVisitor?.id) {
      approveVisitorMutation.mutate({
        visitorId: selectedVisitor.id,
        status: 'approved'
      });
    }
  };

  const handleDisapprove = () => {
    if (selectedVisitor?.id && selectedVisitor.status === 'approved') {
      const reason = prompt('Please provide a reason for disapproval:');
      if (reason) {
        approveVisitorMutation.mutate({
          visitorId: selectedVisitor.id,
          status: 'rejected',
          notes: reason
        });
      }
    }
  };

  const handleEmergencyCheckout = () => {
    const confirmed = confirm('Are you sure you want to check out ALL currently checked-in visitors? This action cannot be undone.');
    if (confirmed) {
      emergencyCheckoutMutation.mutate();
    }
  };

  const handleExportReport = () => {
    exportReportMutation.mutate();
  };

  // Calculate duration for checked-in visitors
  const calculateDuration = (checkedInAt: string): string => {
    const timeIn = new Date(checkedInAt);
    const now = new Date();
    const duration = Math.floor((now.getTime() - timeIn.getTime()) / (1000 * 60)); // minutes
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Generate CSV content from report data
  const generateCSV = (data: any): string => {
    const headers = [
      'ID',
      'Visitor Name',
      'Visitor Email',
      'Visitor Company',
      'Host Name',
      'Visit Date',
      'Check In Time',
      'Check Out Time',
      'Duration',
      'Badge Number',
      'Notes',
      'Status',
      'Created At',
      'Updated At'
    ];

    const csvHeaders = headers.join(',');
    const csvRows = data.visits.map((visit: any) => [
      visit.id,
      `"${visit.visitor_name}"`,
      `"${visit.visitor_email}"`,
      `"${visit.visitor_company}"`,
      `"${visit.host_name}"`,
      visit.visit_date,
      visit.check_in_time || '',
      visit.check_out_time || '',
      visit.duration || '',
      visit.badge_number || '',
      `"${visit.notes || ''}"`,
      visit.status,
      visit.created_at || '',
      visit.updated_at || ''
    ].join(','));

    return [csvHeaders, ...csvRows].join('\n');
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
        {/* Status Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Building Status: Normal • {checkedInVisitors.length} visitors currently in building • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Reception Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* QR Scanner Section */}
          {/* <Card>
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
            </CardHeader>
            <CardContent> */}
          {/* QR Scanner Placeholder */}
          {/* <div className="bg-gray-900 rounded-lg mb-4 aspect-video flex items-center justify-center relative">
                <Camera className="h-16 w-16 text-white" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-white rounded-lg opacity-50"></div>
                </div>
              </div> */}

          {/* Scanner Controls */}
          {/* <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Scan visitor QR code to check in/out</p>
                  <Button className="w-full">
                    <QrCode className="mr-2 h-4 w-4" />
                    Start Scanner
                  </Button>
                </div> */}

          {/* Manual Entry */}
          {/* <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Manual Entry</p>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Badge Number"
                      value={manualBadgeNumber}
                      onChange={(e) => setManualBadgeNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBadgeLookup()}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleBadgeLookup}
                      disabled={badgeLookupMutation.isPending}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Check-in/out Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Visitor Check-in/out</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by name, company, or badge number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value || "")}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Visitor List */}
              {(() => { console.log('Render state:', { isSearching, searchResults }); return null; })()}
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching visitors...</p>
                </div>
              ) : searchResults?.data?.length ? (
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {searchQuery ? `Found ${searchResults?.total || 0} matching visitors` : 'All visitors'}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults?.data?.map((visitor: Visitor) => (
                      <div
                        key={visitor.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedVisitor?.id === visitor.id
                            ? 'bg-primary/10 hover:bg-primary/20'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedVisitor(visitor)}
                      >
                        <div className="flex items-center space-x-3">
                          {visitor.photoUrl && (
                            <img
                              src={visitor.photoUrl}
                              alt={`${visitor.firstName} ${visitor.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {visitor.firstName} {visitor.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {visitor.company || 'No company'} • Badge #{visitor.badgeNumber}
                            </p>
                          </div>
                          <Badge className={`status-${visitor.status}`}>
                            {visitor.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(searchResults?.last_page || 0) > 1 && (
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(page => page - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {searchResults?.last_page || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === (searchResults?.last_page || 1)}
                        onClick={() => setCurrentPage(page => page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 mb-6">
                  <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No visitors found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-500">Try a different search term</p>
                  )}
                </div>
              )}

              {/* Selected Visitor Display */}
              {selectedVisitor ? (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4">
                    {selectedVisitor.photoUrl && (
                      <img
                        src={selectedVisitor.photoUrl}
                        alt="Selected Visitor"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {selectedVisitor.firstName} {selectedVisitor.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedVisitor.company}</p>
                      <p className="text-sm text-gray-500">Badge: #{selectedVisitor.badgeNumber}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={`status-${selectedVisitor.status}`}>
                          {selectedVisitor.status}
                        </Badge>
                        {/* {selectedVisitor.visitRequests?.[0] && (
                          <>
                            <Badge className={`status-${selectedVisitor.visitRequests[0].status}`}>
                              {selectedVisitor.visitRequests[0].status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Host: {selectedVisitor.visitRequests[0].host?.firstName} {selectedVisitor.visitRequests[0].host?.lastName}
                            </span>
                          </>
                        )} */}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mt-4">
                    {/* Check-in/out buttons */}
                    {selectedVisitor.status === 'approved' ? (
                      <div className="flex space-x-3"  >
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleCheckIn}
                          disabled={checkInOutMutation.isPending || selectedVisitor.visitRequests[0]?.status === 'checked_in' || selectedVisitor.status !== 'approved'}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Check In
                        </Button>
                        <Button
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={handleCheckOut}
                          disabled={checkInOutMutation.isPending || selectedVisitor.visitRequests[0]?.status !== 'checked_in'}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Check Out
                        </Button>
                      </div>
                    ) : (
                      <span>

                      </span>
                    )}


                    {/* Approve/unapprove buttons */}
                    <div className="flex space-x-3">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={handleApprove}
                        disabled={approveVisitorMutation.isPending || selectedVisitor.status === 'approved'}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                        onClick={handleDisapprove}
                        disabled={approveVisitorMutation.isPending || selectedVisitor.status !== 'approved'}
                        title={selectedVisitor.status !== 'approved' ? 'Only approved visitors can be disapproved' : 'Disapprove this visitor'}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Disapprove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 mb-6 text-center">
                  <p className="text-gray-500">No visitor selected</p>
                  <p className="text-sm text-gray-400">Search or scan QR code to select a visitor</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEmergencyCheckout}
                  disabled={emergencyCheckoutMutation.isPending}
                >
                  <AlertTriangle className="h-4 w-4 mr-3 text-amber-500" />
                  <span className="text-sm">
                    {emergencyCheckoutMutation.isPending ? "Processing..." : "Emergency Checkout All"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportReport}
                  disabled={exportReportMutation.isPending}
                >
                  <FileOutput className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="text-sm">
                    {exportReportMutation.isPending ? "Generating..." : "Export Today's Report"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Visitors */}
          <Card>
            <CardHeader>
              <CardTitle>Currently In Building</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCheckedIn ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : checkedInVisitors.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No visitors currently checked in</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {checkedInVisitors.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        {visit.visitor.photoUrl && (
                          <img
                            src={visit.visitor.photoUrl}
                            alt="Visitor"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {visit.visitor.firstName} {visit.visitor.lastName}
                          </p>
                          <p className="text-xs text-gray-500">In for {calculateDuration(visit.checkedInAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Host: {visit.host.firstName} {visit.host.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Expected: {visit.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Emergency Info */}
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Emergency Contact</p>
                    <p className="text-sm text-red-600">Security: ext. 911 | Reception: ext. 100</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
