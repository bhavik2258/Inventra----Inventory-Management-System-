import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { ManagerDashboard } from './dashboards/ManagerDashboard';
import { ClerkDashboard } from './dashboards/ClerkDashboard';
import { AuditorDashboard } from './dashboards/AuditorDashboard';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'clerk':
        return <ClerkDashboard />;
      case 'auditor':
        return <AuditorDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container px-4 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
