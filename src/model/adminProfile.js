import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Counter from './counter.js';

const { Schema, model } = mongoose;

const adminSchema = new Schema({
    // ===== ADMIN IDENTIFICATION =====
    adminId: {
        type: String,
        unique: true
    },

    // ===== AUTHENTICATION =====
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
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },

    // ===== OWNER INFO (Step 1) =====
    ownerInfo: {
        name: {
            type: String,
            trim: true,
            required: function() { return this.ownerInfoCollected; }
        },
        mobile: {
            type: String,
            trim: true,
            required: function() { return this.ownerInfoCollected; },
            match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
        },
        proof: {
            type: String,
            enum: ['Aadhar', 'PAN', 'Driving License', 'Voter ID'],
            required: function() { return this.ownerInfoCollected; }
        },
        proofNumber: {
            type: String,
            trim: true,
            required: function() { return this.ownerInfoCollected; }
        }
    },

    // ===== OWNER DOCUMENTS =====
    ownerDocuments: {
        aadharCard: {
            fileName: String,
            fileUrl: String,
            fileKey: String,
            uploadedAt: Date
        },
        panCard: {
            fileName: String,
            fileUrl: String,
            fileKey: String,
            uploadedAt: Date
        }
    },

    // ===== HOSPITAL REFERENCE =====
    hospitalId: {
        type: String,
        ref: 'Hospital',
        required: function() { return this.basicInfoCollected; }
    },

    // ===== PROGRESS TRACKING FLAGS =====
    ownerInfoCollected: {
        type: Boolean,
        default: false
    },
    basicInfoCollected: {
        type: Boolean,
        default: false
    },
    addressInfoCollected: {
        type: Boolean,
        default: false
    },
    contactDetailsCollected: {
        type: Boolean,
        default: false
    },
    documentsCollected: {
        type: Boolean,
        default: false
    },
    operationDetailsCollected: {
        type: Boolean,
        default: false
    },

    // ===== VERIFICATION STATUS =====
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    isActive: {
        type: Boolean,
        default: true // Set to true for testing
    },

    // ===== TIMESTAMPS =====
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    verifiedAt: {
        type: Date
    },
    lastLoginAt: {
        type: Date
    }
});

// ===== MIDDLEWARE =====

// Generate adminId and hash password before saving
adminSchema.pre('save', async function(next) {
    const doc = this;

    if (doc.isNew) {
        // Generate adminId if not provided
        if (!doc.adminId) {
            try {
                const counter = await Counter.findOneAndUpdate(
                    { _id: 'adminId_sequence' },
                    { $inc: { sequence_value: 1 } },
                    { new: true, upsert: true }
                );
                
                if (!counter) {
                    return next(new Error('Failed to retrieve or update counter sequence.'));
                }
                
                const paddedSequence = String(counter.sequence_value).padStart(4, '0');
                doc.adminId = `A${paddedSequence}`;
            } catch (error) {
                return next(error);
            }
        }
    }

    // Hash password if modified
    if (this.isModified('password')) {
        try {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            this.password = await bcrypt.hash(this.password, saltRounds);
        } catch (error) {
            return next(error);
        }
    }

    // Update timestamp
    this.updatedAt = new Date();
    next();
});

// ===== INSTANCE METHODS =====

// Compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if onboarding is complete
adminSchema.methods.isOnboardingComplete = function() {
    return this.ownerInfoCollected && 
           this.basicInfoCollected && 
           this.addressInfoCollected && 
           this.contactDetailsCollected && 
           this.documentsCollected && 
           this.operationDetailsCollected;
};

// Get hospital details (populated)
adminSchema.methods.getHospitalDetails = async function() {
    if (!this.hospitalId) return null;
    return await mongoose.model('Hospital').findOne({ hospitalId: this.hospitalId });
};

// Check if account is fully verified
adminSchema.methods.isFullyVerified = function() {
    return this.verificationStatus === 'Approved' && this.isActive;
};

// Get onboarding progress percentage (6 steps total)
adminSchema.methods.getOnboardingProgress = function() {
    let progress = 0;
    const steps = [
        this.ownerInfoCollected,
        this.basicInfoCollected,
        this.addressInfoCollected,
        this.contactDetailsCollected,
        this.documentsCollected,
        this.operationDetailsCollected
    ];
    
    const completedSteps = steps.filter(step => step === true).length;
    progress = (completedSteps / 6) * 100;
    
    return Math.round(progress * 100) / 100; // Round to 2 decimal places
};

// ===== STATIC METHODS =====

// Find admin by email
adminSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Find admin by username
adminSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username });
};

// Find pending verifications
adminSchema.statics.findPendingVerifications = function() {
    return this.find({ 
        verificationStatus: 'Pending',
        ownerInfoCollected: true,
        basicInfoCollected: true,
        addressInfoCollected: true,
        contactDetailsCollected: true,
        documentsCollected: true,
        operationDetailsCollected: true
    });
};

// ===== INDEXES =====
adminSchema.index({ email: 1 });
adminSchema.index({ username: 1 });
adminSchema.index({ adminId: 1 });
adminSchema.index({ verificationStatus: 1 });
adminSchema.index({ isActive: 1 });

const AdminProfile = model('AdminProfile', adminSchema);

export default AdminProfile;
