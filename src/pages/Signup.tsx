import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signup(email, password, fullName, role);
      if (error) {
        toast.error(error.message || 'Signup failed');
      } else {
        toast.success('Account created successfully! You can now login.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[hsl(25,100%,55%)] to-[hsl(30,100%,50%)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(25,100%,55%)] shadow-lg">
              <Package className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
              <CardDescription className="text-base mt-2">
                Join Inventra today and start managing your inventory
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="text-base"
                >
                  Already have an account? Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
