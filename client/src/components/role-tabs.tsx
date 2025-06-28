import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, QrCode, Settings } from "lucide-react";

export default function RoleTabs() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isAuthenticated || !user) {
    return null;
  }

  const tabs = [
    {
      id: "visitor",
      label: "Visitor Registration",
      icon: UserPlus,
      path: "/register",
      roles: ["admin", "host", "reception"], // Available to all authenticated users
    },
    {
      id: "host",
      label: "Host Dashboard",
      icon: UserCheck,
      path: "/host",
      roles: ["host", "admin"],
    },
    {
      id: "reception",
      label: "Reception",
      icon: QrCode,
      path: "/reception",
      roles: ["reception", "admin"],
    },
    {
      id: "admin",
      label: "Admin Panel",
      icon: Settings,
      path: "/admin",
      roles: ["admin"],
    },
  ];

  const availableTabs = tabs.filter(tab => 
    tab.roles.includes(user.role) || tab.id === "visitor"
  );

  const isActive = (path: string) => {
    if (path === "/register") {
      return location === "/register";
    }
    return location === path;
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setLocation(tab.path)}
                className={`border-b-2 rounded-none px-1 py-4 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
