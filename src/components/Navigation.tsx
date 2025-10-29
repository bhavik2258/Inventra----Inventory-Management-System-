import { LogOut, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/NotificationDropdown';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 container mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[hsl(25,100%,55%)]">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Inventra</h1>
            <p className="text-xs text-muted-foreground">Inventory Management</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Info */}
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <Badge variant="secondary" className="text-xs">
              {user?.role.toUpperCase()}
            </Badge>
          </div>

          {/* Logout */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
