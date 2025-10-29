import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Bell, 
  Shield, 
  BarChart3,
  ArrowRight,
  Warehouse
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { staggerChildren: 0.2 }
  };

  const features = [
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: 'Smart Stock Tracking',
      description: 'Real-time inventory updates with advanced tracking algorithms'
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: 'Real-time Reporting',
      description: 'Comprehensive analytics and insights at your fingertips'
    },
    {
      icon: <Bell className="h-10 w-10" />,
      title: 'Automated Notifications',
      description: 'Stay informed with intelligent alerts and reminders'
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: 'Secure Role-Based Access',
      description: 'Multi-level access control for maximum security'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <img 
                src="/inventra-logo.svg" 
                alt="Inventra Logo" 
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold text-primary">Inventra</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-primary"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Sign Up
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="space-y-8"
            >
              <motion.div variants={fadeInUp} className="space-y-6">
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
                  Manage Your{' '}
                  <span className="text-primary">Inventory</span>
                  {' '}Like a Pro
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Inventra helps businesses manage their products, track stock, monitor reports, 
                  and ensure accurate inventory – all in one intuitive dashboard.
                </p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="px-8 py-6 text-lg border-2 border-primary text-primary hover:bg-primary/5"
                >
                  Create Account
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-8 pt-8"
              >
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-primary">10K+</span>
                  <span className="text-gray-600">Active Users</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-primary">50K+</span>
                  <span className="text-gray-600">Products Managed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-primary">99%</span>
                  <span className="text-gray-600">Satisfaction Rate</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-3xl"></div>
              
              {/* Illustration Container */}
              <div className="relative bg-gradient-to-br from-primary/10 to-white rounded-3xl p-12 shadow-2xl border border-primary/10">
                <Warehouse className="h-80 w-80 text-primary/30 mx-auto" />
                <div className="absolute top-8 right-8">
                  <div className="bg-primary/20 rounded-full p-4">
                    <BarChart3 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white rounded-lg shadow-lg p-4 border border-primary/10">
                    <img 
                      src="/inventra-logo.svg" 
                      alt="Inventra Logo" 
                      className="h-10 w-10"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-orange-50/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for{' '}
              <span className="text-primary">Better Management</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your inventory efficiently and effectively
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="bg-primary/10 rounded-xl p-4 w-fit mb-6 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary to-[hsl(25,100%,55%)] rounded-3xl p-12 text-center shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Inventory Management?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using Inventra to streamline their operations
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2F4F4F] text-[#DDDDDD] py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img 
                src="/inventra-logo.svg" 
                alt="Inventra Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">Inventra</span>
            </div>
            <p className="text-lg">
              © 2025 Inventra | Designed by Ganesh Dandekar
            </p>
            <div className="flex justify-center space-x-6 mt-6">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

