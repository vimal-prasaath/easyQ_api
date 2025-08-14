import mongoose from "mongoose";
import Counter from './counter.js';

const { Schema, model } = mongoose;
const hospitalSchema = new Schema({
  hospitalId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  ambulanceNumber: {
    type: String,
    sparse: true,
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
    },
  },
  isActive:{type:Boolean,default:true},
  departments: [
    {
      name: {
        type: String,
        trim: true,
        required: true,
      },
      headOfDepartment: { type: String, trim: true },
      departmentHeadDoctorId: { type: String },
      contactNumber: { type: String },
      description: { type: String, trim: true },
      doctorIds: [
        {
          type: String,
          ref: "Doctor",
        },
      ],
      total_number_Doctor: {
        type: Number,
        get: function () {
          if (this.doctorIds.length === 0) return 0;
          return this.doctorIds.length - 1;
        },
      },
    },
  ],
  hospitalType: {
    type: String,
    required: true,
    enum: ['Hospital', 'Clinic', 'Consultant']
  },
  
  // ===== ADMIN FLOW ENHANCEMENTS =====
  
  // Admin Reference
  adminId: {
    type: String,
    ref: 'AdminProfile',
    required: true
  },
  
  // Registration Details
  registrationNumber: {
    type: String,
    trim: true,
    required: true
  },
  yearEstablished: {
    type: Number,
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  
  // Enhanced Address
  googleMapLink: {
    type: String,
    trim: true
  },
  
  // Enhanced Contact Details
  alternativePhone: {
    type: String,
    trim: true
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/
  },
  
  // Operation Details
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  startTime: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  endTime: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  openAlways: {
    type: Boolean,
    default: false
  },
  maxTokenPerDay: {
    type: Number,
    min: [1, 'Max tokens per day must be at least 1']
  },
  unlimitedToken: {
    type: Boolean,
    default: false
  },
  
  // Document References (stored in File model)
  documents: {
    registrationCertificate: {
      fileName: String,
      fileUrl: String,
      fileKey: String,
      uploadedAt: Date
    },
    accreditation: {
      fileName: String,
      fileUrl: String,
      fileKey: String,
      uploadedAt: Date
    },
    logo: {
      fileName: String,
      fileUrl: String,
      fileKey: String,
      uploadedAt: Date
    },
    hospitalImages: [{
      fileName: String,
      fileUrl: String,
      fileKey: String,
      uploadedAt: Date
    }]
  },
  
  imageUrl: {
    type: String,
    default: "https://example.com/default-hospital.png",
  },
  patientIds: [
    {
      type: String,
      ref: "User",
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a 2dsphere index on the location field
hospitalSchema.index({ location: "2dsphere" });

hospitalSchema.set("toJSON", { virtuals: true });
hospitalSchema.set("toObject", { virtuals: true });
// Generate hospitalId before saving
hospitalSchema.pre("save", async function (next) {
  // Generate hospitalId if not provided
  if (!this.hospitalId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'hospitalId' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.hospitalId = `H${counter.sequence_value.toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

const Hospital = model("Hospital", hospitalSchema);
export default Hospital;
