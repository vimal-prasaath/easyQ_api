# User App - Requirements Documentation

## 📱 Overview

This document outlines the complete requirements for the EasyQ User Mobile Application. The user app provides patients with a comprehensive platform to discover hospitals, book appointments, manage their health records, and interact with healthcare providers.

---

## 🔐 Authentication & Onboarding

### 1. Live OTP Authentication
- **Enable Live OTP**: Real-time OTP (One-Time Password) verification system
- **Login**: Secure user login with OTP verification
- **Onboarding**: User onboarding flow for new users

---

## 👤 User Profile Management

### 2. Profile Section
- **Profile View**: Display user profile information
- **Profile Update**: Ability to update profile details
- **Profile Validation**: Validate all profile updates before saving
- **Data Integrity**: Ensure all profile fields are properly validated

---

## 📅 Appointments Management

### 3. All Appointment Listing
- **Display Appointments**: Show all user appointments
- **Status Filtering**: 
  - **Completed Appointments**: Display past/completed appointments
  - **Upcoming Appointments**: Display future scheduled appointments
- **Proper Categorization**: Clear distinction between completed and upcoming appointments

### 4. Follow-up Listing
- **Follow-up Appointments**: Display all follow-up appointments
- **Follow-up Management**: View and manage follow-up appointment details

---

## 📄 Documents Management

### 5. Documents Listing
- **Document View**: Display all user documents
- **Document Organization**: Organize documents by type, date, or category
- **Document Access**: Easy access to all medical documents

---

## ⭐ Favourites Management

### 6. Favourites Listing
- **Favourites View**: Display all favourited hospitals and doctors
- **Unfavourite Functionality**: Ability to remove items from favourites
- **Favourite Management**: Easy toggle between favourite and unfavourite states

---

## 📍 Address Management

### 7. My Addresses Listing
- **Address Display**: Show all saved addresses
- **Add New Address**: Functionality to add new addresses
- **Set Default Address**: Ability to mark an address as default
- **Delete Address**: Remove addresses from the list
- **Address Management**: Full CRUD operations for addresses

---

## 🎨 Theme & Settings

### 8. Theme Switching
- **Light Theme**: Light mode interface
- **Dark Theme**: Dark mode interface
- **Theme Toggle**: Seamless switching between light and dark themes
- **UX Consistency**: Ensure consistent user experience across all themes
- **Theme Persistence**: Save user's theme preference

---

## ℹ️ Information Pages

### 9. About Us
- **About Us Page**: Display information about the application
- **Company Information**: Details about EasyQ and its mission

### 10. Policy Text
- **Privacy Policy**: Display privacy policy
- **Terms of Service**: Display terms and conditions
- **Legal Information**: Access to all policy documents

---

## 🏥 Hospital Discovery & Booking

### 11. Dashboard
- **Main Dashboard**: Home screen with key information
- **Quick Access**: Easy navigation to main features
- **Summary Cards**: Display important information at a glance

### 12. Hospital Cards
- **Hospital Display**: Show hospital information in card format
- **Distance Display**: Show distance from user's location on each card
- **Hospital Details**: Click on cards to view detailed hospital information

### 13. Filtering and Searching
- **Search Functionality**: Search hospitals by name, specialty, or location
- **Filter Options**: Filter hospitals by:
  - Distance
  - Specialty
  - Rating
  - Availability
- **Advanced Filters**: Multiple filter combinations

### 14. Hospital Details
- **Detailed View**: Comprehensive hospital information
- **Services Offered**: List of services and facilities
- **Operating Hours**: Hospital timings
- **Contact Information**: Phone, email, address
- **Location Map**: Hospital location on map

### 15. Doctor Listing
- **Doctor Display**: List all doctors in a selected hospital
- **Doctor Profiles**: View doctor details, specialties, and availability
- **Doctor Information**: Qualifications, experience, and ratings

### 16. Add to Favourites
- **Favourite Hospitals**: Add hospitals to favourites
- **Favourite Doctors**: Add doctors to favourites
- **Quick Favourite**: Easy one-tap favourite functionality

---

## 📋 Appointment Booking

### 17. Booking the Appointment
- **Date Restrictions**: 
  - **No Past Dates**: Prevent booking appointments for past dates
  - **Future Dates Only**: Only allow booking for current or future dates
- **Booking Rules**:
  - **One Appointment Per Day**: Limit to one appointment per day per hospital
  - **Hospital-Specific Limit**: Enforce daily limit per hospital
- **Booking Flow**: Step-by-step appointment booking process

### 18. Appointment Summary Screen
- **Booking Summary**: Display complete appointment details before confirmation
- **Review Information**: 
  - Hospital name
  - Doctor name
  - Date and time
  - Appointment type
  - Estimated cost (if applicable)
- **Edit Option**: Ability to modify booking before confirmation

### 19. Booking Confirmation
- **Confirmation Screen**: Display booking confirmation details
- **Confirmation Number**: Unique booking reference number
- **Confirmation Details**: All appointment information
- **Next Steps**: Instructions for the appointment day

---

## 🔍 QR Code & Sharing

### 20. Scanner QR
- **QR Code Scanner**: Scan QR codes for check-in/check-out
- **QR Code Display**: Display user's appointment QR code
- **QR Code Functionality**: Use QR codes for hospital check-in

### 21. Shareable Button
- **Share Functionality**: Share appointment details
- **Share Options**: Multiple sharing methods (SMS, Email, Social Media)
- **Share Content**: Appointment details, QR code, or hospital information

---

## 🚪 Account Management

### 22. Logout
- **Logout Functionality**: Secure user logout
- **Session Clear**: Clear all user session data
- **Return to Login**: Navigate back to login screen

### 23. Delete User
- **Account Deletion**: Ability to delete user account
- **Confirmation**: Require confirmation before account deletion
- **Data Removal**: Remove all user data and associated records
- **Warning**: Display consequences of account deletion

---

## ✅ Testing & Validation Checklist

### Authentication
- [ ] Live OTP verification works correctly
- [ ] Login flow is smooth and secure
- [ ] Onboarding process is intuitive

### Profile Management
- [ ] Profile updates save correctly
- [ ] All validations work as expected
- [ ] Profile data displays accurately

### Appointments
- [ ] Completed appointments show correctly
- [ ] Upcoming appointments display properly
- [ ] Follow-up appointments are listed

### Documents
- [ ] All documents are accessible
- [ ] Document listing is organized

### Favourites
- [ ] Can add to favourites
- [ ] Can remove from favourites (unfavourite)
- [ ] Favourites persist across sessions

### Addresses
- [ ] Can add new address
- [ ] Can set default address
- [ ] Can delete address
- [ ] Address list updates correctly

### Theme
- [ ] Light theme works across all screens
- [ ] Dark theme works across all screens
- [ ] Theme switching is smooth
- [ ] UX is consistent in both themes

### Hospital Discovery
- [ ] Dashboard displays correctly
- [ ] Hospital cards show distance
- [ ] Filtering works properly
- [ ] Search functionality works
- [ ] Hospital details display correctly
- [ ] Doctor listing shows all doctors
- [ ] Can add hospitals/doctors to favourites

### Appointment Booking
- [ ] Cannot book past dates
- [ ] One appointment per day per hospital rule enforced
- [ ] Appointment summary shows all details
- [ ] Booking confirmation displays correctly

### QR & Sharing
- [ ] QR scanner works
- [ ] QR code displays correctly
- [ ] Share functionality works

### Account
- [ ] Logout works correctly
- [ ] Delete user requires confirmation
- [ ] Account deletion removes all data

---

## 📊 Feature Summary

| Category | Features | Status |
|----------|----------|--------|
| Authentication | Live OTP, Login, Onboarding | ⏳ Pending |
| Profile | View, Update, Validation | ⏳ Pending |
| Appointments | Listing, Follow-ups | ⏳ Pending |
| Documents | Listing, Organization | ⏳ Pending |
| Favourites | Listing, Add/Remove | ⏳ Pending |
| Addresses | CRUD Operations | ⏳ Pending |
| Theme | Light/Dark Mode | ⏳ Pending |
| Information | About Us, Policies | ⏳ Pending |
| Discovery | Dashboard, Cards, Search, Filters | ⏳ Pending |
| Booking | Appointment Booking, Rules, Summary, Confirmation | ⏳ Pending |
| QR & Share | Scanner, Shareable | ⏳ Pending |
| Account | Logout, Delete | ⏳ Pending |

---

## 🔄 Integration Points

### API Endpoints Required
- Authentication endpoints (OTP, Login)
- User profile endpoints
- Appointment endpoints
- Document endpoints
- Favourites endpoints
- Address endpoints
- Hospital search and filter endpoints
- Doctor listing endpoints
- Booking endpoints
- QR code endpoints

### External Services
- OTP Service (SMS/Email)
- Location Services (GPS)
- Map Integration
- QR Code Generation/Scanning
- File Storage (Documents)

---

## 📝 Notes

- All features should be tested across different devices and screen sizes
- Ensure proper error handling and user feedback
- Implement proper loading states for all async operations
- Follow accessibility guidelines for mobile apps
- Ensure data privacy and security compliance
- Implement proper offline handling where applicable

---

**Last Updated**: November 2025  
**Version**: 1.0  
**Status**: Requirements Gathering

