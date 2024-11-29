const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User Schema
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    profilePicture: { 
        type: String,
        default: 'uploads/profiles/default.png' 
    },
    bio: { 
        type: String 
    },
    isLoggedIn: { type: Boolean, default: false },
    resetPasswordToken: String, // Optional field for password resets
    resetPasswordExpire: Date,  // Expiration time for password reset token
}, { 
    timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password for login
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
