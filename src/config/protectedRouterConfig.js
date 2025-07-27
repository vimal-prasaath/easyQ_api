import {
    getAllUser,
    updateUser,
    finduser,
    deleteUser,
    resetUserPassword,
    activateUser,
    getAllInActiveUser,
    
} from "../controller/user.js";
import {login} from "../controller/login.js"
import {
    createHospital,
    getHospitalDetails,
    updateFacility,
    updateReviewComment,
    hospitalFacility,
    createReviews,
    deleteHsptl,
    getAllHospitalDetails,
    updateHospitalBasicDetails,
    getHospitalDetailsBylocation
} from "../controller/hospital.js";

import {
    createDoctor,
    getDoctor,
    deleteDoctor,
    getAllDoctor,
    updateDoctor,
    meetDoctor
} from "../controller/doctor.js";

import {
    createAppointment,
    updateAppointment,
    deleteAppointment,
    processAppointment,
    getAppointmentsByDoctor,
    getAppointmentById,
    getAppointmentsByHospital,
    getAppointmentsByPatient
} from "../controller/appointment.js"; 

import { searchHospital } from '../controller/searchController.js'; 

import {
    createPatientNote,
    getPatientNotesByDoctor,
    getPatientNotesByPatient,
    updatePatientNote,
    deletePatientNote
} from '../controller/patientNotes.js';


import { qrGeneator, getQRCode } from '../controller/qrgeneratorControllr.js'; 

import { postfavourite, getfavourite , getfavouriteById } from '../controller/favourite.js'; 

import { createQA, getQAs, updateQA, deleteQA } from '../controller/helpCenter.js'; 

import {
    createReview,
    getReviewsByDoctor,
    getDoctorRatingSummary,
    updateReview,
    updatePatientReview,
    deleteReview,
    moderateReview,
    bulkModerateReviews,
    getSuspiciousReviews
} from '../controller/review.js';

import { uploadFile, getFiles, deleteFile , downloadFile } from "../controller/uploadFile.js"; 
import {uploadMiddleware , multerErrorHandler} from './fileConfig.js'; 
import { searchRateLimit } from '../middleware/rateLimiter.js';


const protectedRoutesConfig = [
    //admin
    { path: '/user', method: 'get', resourceType: 'admin', action: 'read_all', handlers: [getAllUser] },
    { path: '/user/activate/:userId', method: 'put', resourceType: 'admin', action: 'activate', resourceIdParamName: 'userId', handlers: [activateUser] },
    { path: '/user/admins', method: 'get', resourceType: 'admin', action: 'read_inactive_users', handlers: [getAllInActiveUser] },
    //user
    { path: '/user/:userId', method: 'put', resourceType: 'profile', action: 'update', resourceIdParamName: 'userId', handlers: [updateUser] },
    { path: '/user/getdetails', method: 'post', resourceType: 'profile', action: 'read', handlers: [finduser] },
    { path: '/user/delete/:userId', method: 'delete', resourceType: 'profile', action: 'delete', resourceIdParamName: 'userId', handlers: [deleteUser] },
    // { path: '/user/login', method: 'post', resourceType: 'profile', action: 'read', resourceIdParamName: 'userId', handlers: [login] },
  
    // --- HOSPITAL ROUTES ---
       //hospital --> Admin Roles
    { path: '/hospital/basicDetails', method: 'post', resourceType: 'hospital', action: 'create', handlers: [createHospital] },
    { path: '/hospital/facilities', method: 'post', resourceType: 'hospital', action: 'create', handlers: [hospitalFacility] },
    { path: '/hospital/:hospitalId', method: 'delete', resourceType: 'hospital', action: 'delete', resourceIdParamName: 'hospitalId', handlers: [deleteHsptl] },
    { path: '/hospital/details/:hospitalId', method: 'put', resourceType: 'hospital', action: 'update_basic_details', resourceIdParamName: 'hospitalId', handlers: [updateHospitalBasicDetails] },
    { path: '/hospital/facilities/:hospitalId', method: 'put', resourceType: 'hospital', action: 'update_facilities_details', resourceIdParamName: 'hospitalId', handlers: [updateFacility] },
    
        //hospital --> User Roles 
    { path: '/hospital/review/:hospitalId', method: 'put', resourceType: 'hospital_review', action: 'update_review_details', resourceIdParamName: 'hospitalId', handlers: [updateReviewComment] },
    { path: '/hospital/review', method: 'post', resourceType: 'hospital_review', action: 'create', handlers: [createReviews] },
    { path: '/hospital/:userId/:hospitalId', method: 'get', resourceType: 'hospital', action: 'read', resourceIdParamName: 'hospitalId', handlers: [getHospitalDetails] },
    { path: '/hospital/location', method: 'post', resourceType: 'hospital', action: 'read_by_location', handlers: [getHospitalDetailsBylocation] },
    { path: '/hospital', method: 'get', resourceType: 'hospital', action: 'read_all', handlers: [getAllHospitalDetails] },

    // --- DOCTOR ROUTES ---
    { path: '/doctor/add', method: 'post', resourceType: 'doctor', action: 'create', handlers: [createDoctor] },
    { path: '/doctor/:doctorId', method: 'get', resourceType: 'profile', action: 'read', resourceIdParamName: 'doctorId', handlers: [getDoctor] },
    { path: '/doctor/:doctorId', method: 'put', resourceType: 'profile', action: 'update', resourceIdParamName: 'doctorId', handlers: [updateDoctor] },
    { path: '/doctor/:doctorId', method: 'delete', resourceType: 'doctor', action: 'delete', resourceIdParamName: 'doctorId', handlers: [deleteDoctor] },
    { path: '/doctor/all/:hospitalId', method: 'get', resourceType: 'doctor', action: 'read_all_in_hospital', resourceIdParamName: 'hospitalId', handlers: [getAllDoctor] },
    { path: '/doctor/meet', method: 'post', resourceType: 'doctor', action: 'read_all_in_hospital', resourceIdParamName: 'hospitalId', handlers: [meetDoctor] },
    // --- Appoitment ROUTES ---
    { path: '/appoitment', method: 'post', resourceType: 'appointment', action: 'create', handlers: [createAppointment] },
    { path: '/appoitment/process', method: 'post', resourceType: 'appointment', action: 'process_payment', handlers: [processAppointment] },
    { path: '/appoitment/:appointmentId', method: 'put', resourceType: 'appointment', action: 'update', resourceIdParamName: 'appointmentId', handlers: [updateAppointment] },
    { path: '/appoitment/:appointmentId', method: 'delete', resourceType: 'appointment', action: 'delete', resourceIdParamName: 'appointmentId', handlers: [deleteAppointment] },
    { path: '/appoitment/:appointmentId', method: 'get', resourceType: 'appointment', action: 'read', resourceIdParamName: 'appointmentId', handlers: [getAppointmentById] },
    { path: '/appoitment/doctor/:doctorId', method: 'get', resourceType: 'appointment', action: 'read_by_doctor', resourceIdParamName: 'doctorId', handlers: [getAppointmentsByDoctor] },
    { path: '/appoitment/hospital/:hospitalId', method: 'get', resourceType: 'appointment', action: 'read_by_hospital', resourceIdParamName: 'hospitalId', handlers: [getAppointmentsByHospital] },
    { path: '/appoitment/userId/:patientId', method: 'get', resourceType: 'appointment', action: 'read_by_patient', resourceIdParamName: 'patientId', handlers: [getAppointmentsByPatient] },

    // --- SEARCH Bar ROUTES ---
    { path: '/search', method: 'post', resourceType: 'search', action: 'search_hospital', handlers: [searchRateLimit,searchHospital] },
  
    // --- PATIENT NOTES ROUTES ---
    { path: '/patient-notes', method: 'post', resourceType: 'patient_notes', action: 'create', handlers: [createPatientNote] },
    { path: '/patient-notes/doctor/:doctorId', method: 'get', resourceType: 'patient_notes', action: 'read_by_doctor', resourceIdParamName: 'doctorId', handlers: [getPatientNotesByDoctor] },
    { path: '/patient-notes/patient/:patientId', method: 'get', resourceType: 'patient_notes', action: 'read_by_patient', resourceIdParamName: 'patientId', handlers: [getPatientNotesByPatient] },
    { path: '/patient-notes/:noteId', method: 'put', resourceType: 'patient_notes', action: 'update', resourceIdParamName: 'noteId', handlers: [updatePatientNote] },
    { path: '/patient-notes/:noteId', method: 'delete', resourceType: 'patient_notes', action: 'delete', resourceIdParamName: 'noteId', handlers: [deletePatientNote] },

      // --- QR GENERATOR ROUTES ---
    { path: '/qrgenerator', method: 'post', resourceType: 'qr_code', action: 'generate', handlers: [qrGeneator] },
    { path: '/qrgenerator/getdetails', method: 'get', resourceType: 'qr_code', action: 'read', handlers: [getQRCode] },

     // --- FAVOURITE ROUTES ---
    { path: '/favourite/addfav', method: 'post', resourceType: 'favourite', action: 'add', handlers: [postfavourite] },
    { path: '/favourite/:userId/:hospitalId', method: 'get', resourceType: 'favourite', action: 'read', resourceIdParamName: 'userId', handlers: [getfavourite] },
    { path: '/favourite/:userId', method: 'get', resourceType: 'favourite', action: 'read', resourceIdParamName: 'userId', handlers: [getfavouriteById] },
     
   // --- HELP CENTER (Q&A) ROUTES ---
    { path: '/qa', method: 'post', resourceType: 'qa', action: 'create', handlers: [createQA] },
    { path: '/qa', method: 'get', resourceType: 'qa', action: 'read_all', handlers: [getQAs] },
    { path: '/qa/:id', method: 'put', resourceType: 'qa', action: 'update', resourceIdParamName: 'id', handlers: [updateQA] },
    { path: '/qa/:id', method: 'delete', resourceType: 'qa', action: 'delete', resourceIdParamName: 'id', handlers: [deleteQA] },

     // --- REVIEW ROUTES ---
    { path: '/doctor/reviews', method: 'post', resourceType: 'review', action: 'create', handlers: [createReview] },
    { path: '/reviews/doctor/:doctorId', method: 'get', resourceType: 'review', action: 'read_by_doctor', resourceIdParamName: 'doctorId', handlers: [getReviewsByDoctor] },
    { path: '/reviews/doctor/:doctorId/summary', method: 'get', resourceType: 'review', action: 'read_doctor_summary', resourceIdParamName: 'doctorId', handlers: [getDoctorRatingSummary] },
    { path: '/reviews/patient/:patientId/doctor/:doctorId', method: 'put', resourceType: 'review', action: 'update_patient_review', resourceIdParamName: 'patientId', handlers: [updatePatientReview] },
    { path: '/reviews/:reviewId', method: 'put', resourceType: 'review', action: 'update', resourceIdParamName: 'reviewId', handlers: [updateReview] },
    { path: '/reviews/:reviewId', method: 'delete', resourceType: 'review', action: 'delete', resourceIdParamName: 'reviewId', handlers: [deleteReview] },
    // { path: '/reviews/:reviewId/moderate', method: 'patch', resourceType: 'review', action: 'moderate', resourceIdParamName: 'reviewId', handlers: [moderateReview] },
    // { path: '/reviews/bulk/moderate', method: 'patch', resourceType: 'review', action: 'bulk_moderate', handlers: [bulkModerateReviews] },
    // { path: '/reviews/admin/suspicious', method: 'get', resourceType: 'review', action: 'read_suspicious', handlers: [getSuspiciousReviews] },
      
    //upload-files
    { path: '/uploadfile', method: 'post', resourceType: 'file', action: 'upload', handlers: [uploadMiddleware.single('file'),multerErrorHandler,uploadFile] },
    { path: '/getfile', method: 'post', resourceType: 'file', action: 'read_all', handlers: [getFiles] },
    { path: '/file/download', method: 'post', resourceType: 'file', action: 'download', handlers: [downloadFile] },
    { path: '/file/delete', method: 'delete', resourceType: 'file', action: 'delete', handlers: [deleteFile] },

];

export default protectedRoutesConfig;
