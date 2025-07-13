
import mongoose from "mongoose";
import validator from "validator";
import Counter from './counter.js';
const {Schema,model} = mongoose

const userSchema = new Schema({
   userId: { 
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters'],
        validate: {
            validator: function(value) {
                return /^[a-zA-Z\s]+$/.test(value);
            },
            message: 'Name can only contain letters and spaces'
        }
    },
    gender: {
        type: String,
        enum: {
            values: ['male', 'female', 'other'],
            message: 'Gender must be either male, female, or other'
        },
        lowercase: true
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(value) {
                if (!value) return true; // Optional field
                const today = new Date();
                const age = today.getFullYear() - value.getFullYear();
                return age >= 0 && age <= 120;
            },
            message: 'Please provide a valid date of birth'
        }
    },
   role: {
    type: String, 
    enum: {
      values: ['user', 'admin'], 
      message: 'Role must be either user or admin'
    },
    required: true, 
    default: 'user' 
  },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            },
            message: 'Please provide a valid email address'
        }
    },
    mobileNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(value) {
                if (!value) return true; // Optional field
                return validator.isMobilePhone(value, 'any');
            },
            message: 'Please provide a valid mobile number'
        }
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    sessionToken: {
        type: String,
        select: false 
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    accessToken: { 
        type: String,
        select: false
    },
    refreshToken: { 
        type: String,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLoginAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { 
        transform: function(doc, ret) {
            delete ret.passwordHash;
            delete ret.sessionToken;
            delete ret.accessToken;
            delete ret.refreshToken;
            delete ret.__v;
            return ret;
        },
    },
});


userSchema.pre('save', async function(next) {
    const doc = this;

    if (doc.isNew) {
        doc.isActive = (doc.role !== 'admin');

        if (!doc.userId) {
            const counterName = doc.role === 'admin' ? 'adminId_sequence' : 'userId_sequence';
            try {
                const counter = await Counter.findOneAndUpdate(
                    { _id: counterName },
                    { $inc: { sequence_value: 1 } },
                    { new: true, upsert: true }
                );
                 if (!counter) { 
                    return next(new Error('Failed to retrieve or update counter sequence.'));
                }
                const paddedSequence = String(counter.sequence_value).padStart(4, '0');
                const prefix = doc.role === 'admin' ? 'A' : 'P';
                doc.userId = `${prefix}${paddedSequence}`;
            } catch (error) {
                next(error)
            }
        }
    }
    next();
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// Virtual for user age
userSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
        return age - 1;
    }
    return age;
});

const User = model('User', userSchema);
export default User;
