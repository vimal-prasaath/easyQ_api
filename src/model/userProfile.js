import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";

const {Schema,model} = mongoose
const userSchema= new Schema({
   userId: { 
        type: String,
        required: true, 
        unique: true,   
        default: () => generateUniqueId({
            length: 4,
            useLetters: false, 
        })
    },
    name:{type:String},
    gender:{type:String},
    dateOfBirth:{type: Date,
         set: function(value) {
            if (typeof value === 'string') {
                const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])\/\d{4}$/;
                if (!dateRegex.test(value)) {
                    // Throw an error if the format is incorrect
                    // Mongoose will catch this and turn it into a ValidationError
                    throw new Error('Date of birth must be in MM/DD/YYYY format.');
                }
                // If format is correct, parse it into a Date object
                return new Date(value);
            }
            // If it's already a Date object or null/undefined, return as is
            return value;
        },
        validate: {
            validator: function(v) {
                return v && v instanceof Date && v < new Date();
            },
            message: props => `${props.value} is not a valid date of birth`
        }
    },
    email:{type:String ,
        required: [true, 'Email is required'], 
        unique:true,
        lowercase: true, 
        trim: true, 
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid email address!' 
        ]
    },
    mobileNumber:{type:String},
    passwordHash:{type:String},
    sessionToken:{type:String},
    googleId:{type:String},
    location:{type:String},
    accessToken: { type: String },
    refreshToken: { type: String }

    
})
const User=model('User',userSchema)
export default User