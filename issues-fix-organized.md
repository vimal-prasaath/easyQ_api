# Issues and Fixes - Organized by Assignee and Category (All Admin App Tasks)

## 🔍 Questions & Analysis Needed

### General Questions
- **Top Rated and Featured tab in dashboard** - Need clarification on requirements
- **Use Case for the hospital type** - Need to understand the business logic
- **What is the use case of the Operation details in onboarding?** - Like hospital opening hours token per day
- **How to capture the lat and long if we enter the map url?** - Technical analysis required

### Location & Technical Analysis
- **How the current app location is captured?** - Need to check with Parthi (used for further notification calculations)

---

## 🧪 Testing Required

### Admin App Testing
- **Leaving the account creation in between** - Need to test user flow interruption
- **Forward and backward on account creation** - Test navigation flow
- **Leaving the account creation in between and coming back** - Test state persistence

---

## 👨‍💻 Vimal's Tasks

### Admin App Features
- **Enable Live OTP** - OTP functionality implementation
- **Hospital Distance from the user location** - Location-based distance calculation
- **Need to allow one booking for user in a slot** - Booking validation logic
- **Booking should not be allowed for past slots** - Time validation for appointments
- **Driver license** - License management functionality
- **Possible to auto populate the address if we have address API** - Address auto-completion (Add-on feature)

---

## 👨‍💻 Parthi's Tasks

### Admin App Features
- **Remove Lat and Long in the UI in adding the address** - UI cleanup for address input
- **Multi Photo upload of hospital** - Multiple image upload functionality
- **Adding about and services is not reflected from the onboarding** - Fix data persistence issue
- **After onboarding without activation, extra icons showing** - Fix UI state management
- **Error messages need to be handled** - Improve error messaging for signup/login
- **For Nurse login, Dashboard not showing checked in/out token count** - Fix permission-based data display
- **Need to show Patient ID + Name in the document and user logged in** - Document display enhancement
- **After scanning the scanner in the checked in UI** - Fix timezone display (IST not showing)

---

## 👥 Parthi & Vimal Combined Tasks

### Admin App Features
- **All sections filters in dashboard** - General Medicine, General Checkup, Pediatrics, etc.
  - Need to add necessary category in hospital level and doctor level specialization
  - Departments already exist in backend, need UI section
- **Grouping the hospitals** - Hospital categorization and grouping
- **Sorting and filtering hospital based on current location** - Location-based hospital filtering
- **Hospital Ratings, Hospital Timings** - Rating and timing display features
- **If I upload document for patient in admin app, show in user app** - Document synchronization (group by date)
- **Need to add specialization as multi-select dropdown in doctor onboarding** - Multi-select specialization feature
- **Filters in the Admin dashboard** - Category filter implementation
- **Followup feature** - Patient followup functionality

---

## 📋 Summary by Category

### 🔧 Technical Issues
- Timezone display issues (IST)
- Data persistence problems
- UI state management
- Error message handling

### 🎨 UI/UX Improvements
- Remove unnecessary fields (Lat/Long)
- Multi-photo upload
- Multi-select dropdowns
- Icon visibility control

### 📍 Location-Based Features
- Distance calculations
- Location-based filtering
- Address auto-population
- Location capture analysis

### 🔐 Authentication & Permissions
- Live OTP implementation
- Permission-based dashboard access
- Account creation flow testing

### 📊 Data Management
- Hospital categorization
- Specialization management
- Document synchronization
- Rating and timing systems

### 🏥 Hospital Management
- Hospital grouping and sorting
- Category filters
- Operation details clarification
- Multi-select specialization

---

## 📝 Notes
- Some tasks require clarification before implementation
- Testing is needed for user flow interruptions
- Several features need backend-frontend coordination
- Location-based features require careful implementation for accuracy
