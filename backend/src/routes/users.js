const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getAllUsers } = require('../controllers/userController');

// GET /api/users - Get all users (authenticated)
router.get('/', authMiddleware, getAllUsers);

module.exports = router;
