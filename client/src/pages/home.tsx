import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Header from "@/components/header";
import RoleTabs from "@/components/role-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Clock, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'host':
          setLocation('/host');
          break;
        case 'reception':
          setLocation('/reception');
          break;
        case 'admin':
          setLocation('/admin');
          break;
        default:
          // Stay on home page for unknown roles
          break;
      }
    }
  }, [user, isLoading, setLocation]);

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
    return null; // Will redirect to landing page via App.tsx
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <RoleTabs />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600">
              Access your {user.role} dashboard to manage visitor activities.
            </p>
          </div>

          {/* Quick Stats */}
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
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="text-2xl font-semibold text-gray-900 capitalize">{user.role}</p>
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
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-2xl font-semibold text-gray-900">{user.department || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Access Level</p>
                    <p className="text-2xl font-semibold text-gray-900">Full</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role-specific Actions */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.role === 'host' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/host')}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Visitors
                  </Button>
                )}
                
                {user.role === 'reception' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/reception')}
                    className="justify-start"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Reception Desk
                  </Button>
                )}
                
                {user.role === 'admin' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/admin')}
                    className="justify-start"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/register')}
                  className="justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Register Visitor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
