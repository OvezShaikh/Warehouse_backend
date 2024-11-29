const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, name, username, email, role, profilePicture) => {
    return jwt.sign({ id, name, username, email, role, profilePicture }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register User
exports.registerUser = async (req, res) => {
    const { name, username, email, password, role, profilePicture } = req.body; // Accept role from request body

    try {
        // Check if user already exists by email
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password before saving it in the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = await User.create({
            name,
            email,
            username,
            password: hashedPassword,
            role: role || 'user', // Default to 'user' if no role is provided
            profilePicture: profilePicture,
        });

        // Return success response with token and user details
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role, // Return the user's role
            profilePicture: user.profilePicture,
            token: generateToken(user._id, user.name, user.username, user.email, user.role, user.profilePicture), // Include role in token
        });
    } catch (error) {
        console.error("Error during registration:", error.message);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists with the provided username
        const user = await User.findOne({ username }).select('+password');
        console.log("Login username",username);

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Log to see values before comparing
        console.log("Entered Password:", password);
        console.log("Stored Password Hash:", user.password);

        // Check if the password matches
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        
        if (!isPasswordCorrect) {
            console.log("Password comparison failed");
            return res.status(401).json({ message: "Invalid password" });
        }

        // Send response with user data and token
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role, // Return the user's role
            profilePicture: user.profilePicture,
            token: generateToken(user._id, user.name, user.username, user.email, user.role, user.profilePicture), // Include role in token
        });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ message: "Server error during login" });
    }
};



exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');  // Exclude password
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);  // Send user profile data
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
};