import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Users, 
  Building, 
  Settings, 
  BarChart3, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Server,
  Camera,
  Mail,
  UserCog
} from "lucide-react";
import { AxiosError } from "axios";

// Form schema for host creation/editing
const hostFormSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

// Form schema for company creation/editing
const companyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email("Invalid email address").optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

// Form schema for user creation/editing
const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["admin", "host", "receptionist"], {
    required_error: "Please select a role",
  })
});

// Stats type definition
interface SystemStats {
  pending_approvals_count: number;
  todays_visits_count: number;
  currently_checked_in: number;
  weekly_total: number;
  lists?: {
    todays_visits: any[];
    pending_approvals: any[];
  };
}

interface ActivityLog {
  type: 'registration' | 'status_change' | 'check_in' | 'check_out';
  visitor_name: string;
  host_name: string;
  timestamp: string;
  description: string;
}

interface ApiErrorResponse {
  message: string;
}

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading, api } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [isHostFormOpen, setIsHostFormOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<any>(null);

  // User form setup
  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "host",
    },
  });

  // Company form setup
  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      contact_person: "",
      contact_email: "",
      contact_phone: "",
      notes: "",
    },
  });

  // Host form setup
  const hostForm = useForm<z.infer<typeof hostFormSchema>>({
    resolver: zodResolver(hostFormSchema),
    defaultValues: {
      company_id: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      notes: "",
      is_active: true,
    },
  });

  // Reset forms when dialogs close
  useEffect(() => {
    if (!isUserFormOpen && !editingUser) {
      userForm.reset();
    }
  }, [isUserFormOpen, editingUser, userForm]);

  useEffect(() => {
    if (!isCompanyFormOpen && !editingCompany) {
      companyForm.reset();
    }
  }, [isCompanyFormOpen, editingCompany, companyForm]);

  useEffect(() => {
    if (!isHostFormOpen && !editingHost) {
      hostForm.reset();
    }
  }, [isHostFormOpen, editingHost, hostForm]);

  // Set form values when editing user
  useEffect(() => {
    if (editingUser) {
      userForm.reset({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      });
    }
  }, [editingUser, userForm]);

  // Set form values when editing company
  useEffect(() => {
    if (editingCompany) {
      companyForm.reset({
        name: editingCompany.name,
        address: editingCompany.address || "",
        contact_person: editingCompany.contact_person || "",
        contact_email: editingCompany.contact_email || "",
        contact_phone: editingCompany.contact_phone || "",
        notes: editingCompany.notes || "",
      });
    }
  }, [editingCompany, companyForm]);

  // Set form values when editing host
  useEffect(() => {
    if (editingHost) {
      hostForm.reset({
        company_id: editingHost.company_id,
        name: editingHost.name,
        email: editingHost.email || "",
        phone: editingHost.phone || "",
        department: editingHost.department || "",
        position: editingHost.position || "",
        notes: editingHost.notes || "",
        is_active: editingHost.is_active,
      });
    }
  }, [editingHost, hostForm]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "//staff-login";
      }, 500);
      return;
    }
    
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch statistics
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const stats: SystemStats = dashboardData?.statistics || {
    pending_approvals_count: 0,
    todays_visits_count: 0,
    currently_checked_in: 0,
    weekly_total: 0,
  };

  // Fetch all companies
  const { data: allCompanies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await api.get("/companies");
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companyFormSchema>) => {
      const response = await api.post("/companies", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Success", description: "Company created successfully" });
      setIsCompanyFormOpen(false);
      companyForm.reset();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create company",
        variant: "destructive",
      });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof companyFormSchema> }) => {
      const response = await api.put(`/companies/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Success", description: "Company updated successfully" });
      setEditingCompany(null);
      setIsCompanyFormOpen(false);
      companyForm.reset();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update company",
        variant: "destructive",
      });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Success", description: "Company deleted successfully" });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  const handleCompanySubmit = async (data: z.infer<typeof companyFormSchema>) => {
    if (editingCompany) {
      await updateCompanyMutation.mutateAsync({ id: editingCompany.id, data });
    } else {
      await createCompanyMutation.mutateAsync(data);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      await deleteCompanyMutation.mutateAsync(companyId);
    }
  };

  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    setIsCompanyFormOpen(true);
    companyForm.reset({
      name: company.name,
      address: company.address || "",
      contact_person: company.contact_person || "",
      contact_email: company.contact_email || "",
      contact_phone: company.contact_phone || "",
      notes: company.notes || "",
    });
  };

  const handleCloseCompanyForm = () => {
    setIsCompanyFormOpen(false);
    setEditingCompany(null);
    companyForm.reset();
  };

  // Fetch all hosts
  const { data: allHosts = [], isLoading: loadingHosts } = useQuery({
    queryKey: ["/api/hosts"],
    queryFn: async () => {
      const response = await api.get("/hosts?include_company=true");
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Create host mutation
  const createHostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hostFormSchema>) => {
      const response = await api.post("/hosts", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hosts"] });
      toast({ title: "Success", description: "Host created successfully" });
      setIsHostFormOpen(false);
      hostForm.reset();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create host",
        variant: "destructive",
      });
    },
  });

  // Update host mutation
  const updateHostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof hostFormSchema> }) => {
      const response = await api.put(`/hosts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hosts"] });
      toast({ title: "Success", description: "Host updated successfully" });
      setEditingHost(null);
      setIsHostFormOpen(false);
      hostForm.reset();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update host",
        variant: "destructive",
      });
    },
  });

  // Delete host mutation
  const deleteHostMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hosts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hosts"] });
      toast({ title: "Success", description: "Host deleted successfully" });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete host",
        variant: "destructive",
      });
    },
  });

  // Toggle host status mutation
  const toggleHostStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/hosts/${id}/toggle-status`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hosts"] });
      toast({ title: "Success", description: "Host status updated successfully" });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update host status",
        variant: "destructive",
      });
    },
  });

  const handleHostSubmit = async (data: z.infer<typeof hostFormSchema>) => {
    if (editingHost) {
      await updateHostMutation.mutateAsync({ id: editingHost.id, data });
    } else {
      await createHostMutation.mutateAsync(data);
    }
  };

  const handleDeleteHost = async (hostId: string) => {
    if (window.confirm("Are you sure you want to delete this host?")) {
      await deleteHostMutation.mutateAsync(hostId);
    }
  };

  const handleEditHost = (host: any) => {
    setEditingHost(host);
    setIsHostFormOpen(true);
    hostForm.reset({
      company_id: host.company_id,
      name: host.name,
      email: host.email || "",
      phone: host.phone || "",
      department: host.department || "",
      position: host.position || "",
      notes: host.notes || "",
      is_active: host.is_active,
    });
  };

  const handleCloseHostForm = () => {
    setIsHostFormOpen(false);
    setEditingHost(null);
    hostForm.reset();
  };

  const handleToggleHostStatus = async (hostId: string) => {
    await toggleHostStatusMutation.mutateAsync(hostId);
  };

  // Fetch all users with filters
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users", roleFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      
      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch activity logs
  const { data: activityLogs = [] } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    queryFn: async () => {
      const response = await api.get("/activity-logs");
      return response.data;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      const response = await api.post("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User created successfully" });
      setIsUserFormOpen(false);
      userForm.reset();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof userFormSchema> }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User updated successfully" });
      setEditingUser(null);
      setIsUserFormOpen(false);
      userForm.reset();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/users/${id}/toggle-status`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "//staff-login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
    if (editingUser) {
      await updateUserMutation.mutateAsync({ id: editingUser.id, data });
    } else {
      await createUserMutation.mutateAsync(data);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    await toggleUserStatusMutation.mutateAsync(userId);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
    userForm.reset({
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  const handleCloseForm = () => {
    setIsUserFormOpen(false);
    setEditingUser(null);
    userForm.reset();
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Admin access is required to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <RoleTabs />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Admin Tab Navigation */}
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>User Management</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Company Management</span>
              </TabsTrigger>
              <TabsTrigger value="hosts" className="flex items-center space-x-2">
                <UserCog className="h-4 w-4" />
                <span>Host Management</span>
              </TabsTrigger>
              {/* <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger> */}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-900">{allUsers.length}</p>
                      <p className="text-xs text-green-600">+{allUsers.filter((u: any) => u.is_active).length} active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Visitors</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats?.weekly_total || 0}</p>
                      <p className="text-xs text-green-600">This week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Today's Visitors</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats?.todays_visits_count || 0}</p>
                      <p className="text-xs text-gray-600">Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats?.pending_approvals_count || 0}</p>
                      <p className="text-xs text-orange-600">Needs attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">Database</span>
                      </div>
                      <span className="text-sm text-green-600">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">API Services</span>
                      </div>
                      <span className="text-sm text-green-600">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-medium text-gray-900">Camera System</span>
                      </div>
                      <span className="text-sm text-amber-600">Degraded</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                      </div>
                      <span className="text-sm text-green-600">Operational</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {activityLogs.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No recent activity</p>
                    ) : (
                      activityLogs.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {activity.type === 'registration' && (
                              <UserPlus className="h-5 w-5 text-blue-500" />
                            )}
                            {activity.type === 'status_change' && (
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                            )}
                            {activity.type === 'check_in' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {activity.type === 'check_out' && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.visitor_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.description} • Host: {activity.host_name}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingUser(null);
                        userForm.reset({
                          name: "",
                          email: "",
                          role: "host",
                        });
                        setIsUserFormOpen(true);
                      }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                      </DialogHeader>
                      <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={userForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {!editingUser && (
                            <FormField
                              control={userForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <FormField
                            control={userForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="host">Host</SelectItem>
                                    <SelectItem value="receptionist">Receptionist</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>Active</FormLabel>
                                <FormMessage />
                              </FormItem>
                            )}
                          /> */}
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCloseForm}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingUser ? "Update" : "Create"} User
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              {/* Search and Filters */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1 max-w-lg">
                    <div className="relative">
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="host">Host</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select> */}
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th> */}
                          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th> */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map((user: any) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.profileImageUrl && (
                                  <img
                                    src={user.profileImageUrl}
                                    alt="User"
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                )}
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`role-${user.role}`}>
                                {user.role}
                              </Badge>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.department || 'N/A'}
                            </td> */}
                            {/* <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={user.is_active ? 'status-approved' : 'status-rejected'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(user.id)}
                              >
                                {user.is_active ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button> */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {allUsers.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to{" "}
                        <span className="font-medium">{allUsers.length}</span> of{" "}
                        <span className="font-medium">{allUsers.length}</span> results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" disabled>
                          Previous
                        </Button>
                        <Button size="sm">1</Button>
                        <Button variant="outline" size="sm" disabled>
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Locations Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Location management features coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Management Tab */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Company Management</CardTitle>
                  <Dialog open={isCompanyFormOpen} onOpenChange={setIsCompanyFormOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingCompany(null);
                        companyForm.reset({
                          name: "",
                          address: "",
                          contact_person: "",
                          contact_email: "",
                          contact_phone: "",
                          notes: "",
                        });
                        setIsCompanyFormOpen(true);
                      }}>
                        <Building className="mr-2 h-4 w-4" />
                        Add Company
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
                      </DialogHeader>
                      <Form {...companyForm}>
                        <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
                          <FormField
                            control={companyForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={companyForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={companyForm.control}
                            name="contact_person"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Person</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={companyForm.control}
                            name="contact_email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={companyForm.control}
                            name="contact_phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={companyForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCloseCompanyForm}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingCompany ? "Update" : "Create"} Company
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {loadingCompanies ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading companies...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Person
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allCompanies.map((company: any) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {company.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {company.contact_person || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {company.contact_email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{company.contact_email}</span>
                                  </div>
                                )}
                                {company.contact_phone && (
                                  <div className="text-sm text-gray-500">
                                    {company.contact_phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {company.address || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCompany(company)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCompany(company.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {allCompanies.length === 0 && !loadingCompanies && (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No companies found. Add your first company!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Host Management Tab */}
          <TabsContent value="hosts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Host Management</CardTitle>
                  <Dialog open={isHostFormOpen} onOpenChange={setIsHostFormOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingHost(null);
                        hostForm.reset({
                          company_id: "",
                          name: "",
                          email: "",
                          phone: "",
                          department: "",
                          position: "",
                          notes: "",
                          is_active: true,
                        });
                        setIsHostFormOpen(true);
                      }}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Add Host
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingHost ? "Edit Host" : "Add New Host"}</DialogTitle>
                      </DialogHeader>
                      <Form {...hostForm}>
                        <form onSubmit={hostForm.handleSubmit(handleHostSubmit)} className="space-y-4">
                          <FormField
                            control={hostForm.control}
                            name="company_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select company" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allCompanies.map((company: any) => (
                                      <SelectItem key={company.id} value={company.id.toString()}>
                                        {company.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={hostForm.control}
                            name="is_active"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>Active</FormLabel>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCloseHostForm}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {editingHost ? "Update" : "Create"} Host
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {loadingHosts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading hosts...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Host Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allHosts.map((host: any) => (
                          <tr key={host.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {host.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {host.position}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {host.company?.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {host.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-4 w-4" />
                                    <span>{host.email}</span>
                                  </div>
                                )}
                                {host.phone && (
                                  <div className="text-sm text-gray-500">
                                    {host.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {host.department || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={host.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {host.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditHost(host)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleHostStatus(host.id)}
                              >
                                {host.is_active ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteHost(host.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {allHosts.length === 0 && !loadingHosts && (
                  <div className="text-center py-8">
                    <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hosts found. Add your first host!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">System settings panel coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
