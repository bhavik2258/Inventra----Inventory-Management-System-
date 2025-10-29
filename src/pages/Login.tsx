import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // Role-based routing will be handled in the handleSubmit function
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignup) {
        const { error } = await signup(email, password, fullName, role);
        if (error) {
          toast.error(error.message || 'Signup failed');
        } else {
          toast.success('Account created successfully! You can now login.');
          setIsSignup(false);
          setPassword('');
          setEmail('');
          setFullName('');
        }
      } else {
        const { error } = await login(email, password);
        if (error) {
          toast.error(error.message || 'Invalid credentials');
        } else {
          toast.success('Login successful!');
          // Navigate after a short delay to ensure user state is updated
          setTimeout(() => {
            // Navigation will be handled by the useEffect when user state updates
          }, 100);
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role-based navigation when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRouteMap = {
        admin: '/dashboard',
        manager: '/dashboard',
        clerk: '/dashboard',
        auditor: '/dashboard'
      };
      
      const route = roleRouteMap[user.role] || '/dashboard';
      navigate(route);
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[hsl(25,100%,55%)] to-[hsl(30,100%,50%)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(25,100%,55%)] shadow-lg">
            <Package className="h-10 w-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Inventra</CardTitle>
            <CardDescription className="text-base mt-2">
              {isSignup ? 'Create your account' : 'Inventory Management System'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label>Select Your Role</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manager" id="manager" />
                    <Label htmlFor="manager" className="font-normal cursor-pointer">Manager</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clerk" id="clerk" />
                    <Label htmlFor="clerk" className="font-normal cursor-pointer">Clerk</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auditor" id="auditor" />
                    <Label htmlFor="auditor" className="font-normal cursor-pointer">Auditor</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Admin access is restricted. Use admin@inventra.com to login as Admin.
                </p>
              </div>
            )}
            
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Sign In')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm"
              >
                {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
