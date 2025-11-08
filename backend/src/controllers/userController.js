const User = require('../models/User');

/**
 * Get all users except the current authenticated user
 * @route GET /api/users
 * @access Private
 */
const getAllUsers = async (req, res) => {
  try {
    // Fetch all users except the current user, excluding password field
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('-password')
      .sort({ username: 1 });

    res.status(200).json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch users',
        code: 'FETCH_USERS_ERROR'
      }
    });
  }
};

module.exports = {
  getAllUsers
};
