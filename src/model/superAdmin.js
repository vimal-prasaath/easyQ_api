import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Counter from './counter.js';

const { Schema, model } = mongoose;

const superAdminSchema = new Schema({
    // ===== SUPER ADMIN IDENTIFICATION =====
    superAdminId: {
        type: String,
        unique: true
    },

    // ===== AUTHENTICATION =====
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [50, 'Username cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },

    // ===== STATUS & METADATA =====
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },

    // ===== TIMESTAMPS =====
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ===== PRE-SAVE MIDDLEWARE =====
superAdminSchema.pre('save', async function(next) {
    const doc = this;

    // Generate superAdminId if new
    if (doc.isNew && !doc.superAdminId) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                'superAdminId',
                { $inc: { sequence_value: 1 } },
                { new: true, upsert: true }
            );
            
            if (!counter) {
                return next(new Error('Failed to retrieve or update counter sequence.'));
            }
            
            const paddedSequence = String(counter.sequence_value).padStart(4, '0');
            doc.superAdminId = `SA${paddedSequence}`;
        } catch (error) {
            return next(error);
        }
    }

    // Hash password if modified
    if (doc.isModified('password')) {
        try {
            const saltRounds = 12;
            doc.password = await bcrypt.hash(doc.password, saltRounds);
        } catch (error) {
            next(error);
        }
    }

    // Update updatedAt
    doc.updatedAt = new Date();
    next();
});

// ===== INSTANCE METHODS =====
// Compare password
superAdminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Update last login
superAdminSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// ===== STATIC METHODS =====
// Find by username
superAdminSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username, isActive: true });
};

// Find by email
superAdminSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email, isActive: true });
};

// Find active super admins
superAdminSchema.statics.findActiveSuperAdmins = function() {
    return this.find({ isActive: true }).select('-password');
};

// ===== INDEXES =====
superAdminSchema.index({ username: 1 });
superAdminSchema.index({ email: 1 });
superAdminSchema.index({ superAdminId: 1 });
superAdminSchema.index({ isActive: 1 });

const SuperAdmin = model('SuperAdmin', superAdminSchema);

export default SuperAdmin;
