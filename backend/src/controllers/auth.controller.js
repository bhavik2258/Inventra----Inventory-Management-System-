import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Restrict signup to Manager, Clerk, and Auditor only
    const allowedRoles = ['manager', 'clerk', 'auditor'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Only Manager, Clerk, and Auditor can sign up.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      role
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded Admin credentials
    if (email === 'admin@inventra.com') {
      const ADMIN_PASSWORD = 'Admin@123';
      
      if (password === ADMIN_PASSWORD) {
        const adminUser = {
          id: 'admin-hardcoded',
          fullName: 'Admin User',
          email: 'admin@inventra.com',
          role: 'admin'
        };

        const token = generateToken(adminUser.id, adminUser.role);

        return res.status(200).json({
          success: true,
          data: {
            user: adminUser,
            token
          },
          message: 'Login successful'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    }

    // For other users, check MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    // Check if it's the hardcoded admin
    if (req.user.userId === 'admin-hardcoded') {
      return res.status(200).json({
        success: true,
        data: {
          id: 'admin-hardcoded',
          fullName: 'Admin User',
          email: 'admin@inventra.com',
          role: 'admin'
        }
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user data'
    });
  }
};
