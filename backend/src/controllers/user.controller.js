import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users'
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { fullName, role } = req.body;
    const userId = req.params.id;

    // Only admins can update roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can update user roles'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, ...(role && { role }) },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
};
