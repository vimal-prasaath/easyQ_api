Admin flow document:

Account  Module:

    1.New Account:
        First Email and password input screen followed by below 6 steps

        6 steps of details collection (Other than what ever mentioned as optional all are required)
            i. Owner info:
                Name
                Email
                Mobile
                Proof (Dropdown, [Aadhar, PAN, Driving Liscene, Voter Id])

            ii. Basic Info:
                Hospital Name
                Hospital Type (Dropdown , [Hospital, Clinic, Consultant])
                Registration Number
                Year Extablished - Optional fields

             iii. Address Info: (if possbile ingrate auto filling state form the 3rd party)

                Address
                State - Dropdown
                City - Dropdown
                Pincode
                Google Map link

            iv. Contact Details:

                Office Phone
                Alternative Phone
                Email Address
            
            v. Document Upload:

                Registration Cerficate Attachment
                Attach Accrediation (optional)
                Upload Logo (with preview)
                Upload hospital Images (3 images with preview)

            vi. Operation details:

                Working Days (All Seven days as a Multi select checkbox dropdown)
                Start time
                End time
                Open Always (Toggle Button -> enabling this will disable Start and End time and clear if values are ther)  
                Max Token per day
                Unlimited Token (Enabling this will disable the max token per day)  
            
        Filling all these and proceeding with clicking Create Account button

    API Details for CreateAccount

    URL:
    Method:
    Payload:
    Response:

    Untill These details was verified by super admin:

    We will show the a awaiting confirmation form Super admin screen

    URL
    Method
    Payload:
    Response: {verified: false}


    2.Login(Existing account)

        Screen Details:
            Email Input
            Password Input

    Untill These details was verified by super admin:

    We will show the a awaiting confirmation form Super admin screen

    URL
    Method
    Payload:
    Response: {verified: false}
        
Post Login Screen:

    Dashboad Module:

        Header:

            Notification
                Live notification. List of appointments 

                API: poller / Sockets
                URL
                Response:

            Scanner
                Will scan the QR and update the checked in deatils of patients

            Profile
                on opening hit api to display the profile details

                URL
                Method
                Payload:
                Response: 


                Owner Info :
                    (Read only what we we have in Owner info in New account creation)
                Hospital Details:
                     (Display ii,iii,iv from New accoutn creation ,and have a option to edit )
                Hospital Documents:
                 (Display v from New accoutn creation ,Only hospital Logo and images are editable and 1 logo and 3 hospital image is mandatory , other certificates are read only )
                Set Token:
                    (Display vi from New account createion , and editble also allowed)

            Settings:
                Delete Account
                    URL
                    Method
                    Payload:
                    Response: 

                Dark Mode
                Log out:
                    URL
                    Method
                    Payload:
                    Response: 

            All the bleow are static hardcoded popup:

            Support Center
            About Us
            Terms & Conditions
            Privacy Policy
        
        Patients Summary:

            Api will be called will give the below two: Pooling

            URL
            Method
            Payload:
            Response: 

            Token Issued: fetched from API
                Clicking on this list the patienst wil the patient and doctor details

                    API
                    URL
                    Payload
                    Response

            Checked in: fetched from API
                Checked in user list
                    API
                    URL
                    Payload
                    Response

        Quick Actions:

            Availability: will hold this module

                List of Doctors temporialy out of avalabiltiy

                Add Docotor occpied:
                    Doctor name
                    Reason (Drop Down, [Meeting, Surgery, Break])
                    
                    URL
                    Method
                    Payload:
                    Response: 

            User logs:

                List all patient with their doctor details, with have the info of followup scheduled or not, iwith checkin and checkout time

                URL
                Method
                Payload:
                Response: 


            Documents:

                List all the douments for all the patients: Clicking on the patitent will display all documents for the particular patient
                    API
                    URL
                    Request
                    Payload

                Upload documet: Need to check how it works?

            
            Doctors List:

                Add Doctors:
                    i. Basic Detatils:
                        Full Name
                        Gender (Dropdown)
                        DOB
                        Email
                        mobile
                        Phone:
                    ii. Professtion Details:
                        Specilzation (Dropdown => [Cardiologist, Dentist, ENT])
                        Degree
                        Year of Experince
                        Rgistration Number
                        Doctor Type (Dropdonw => [Full time, Visiting, Consultant])
                    iii. Availabilty
                        Working Dayys (Dropdnw with multiselect checkbox => [Mn , Tue.....])
                        Start Time
                        End Time
                API:
                URL:
                Payload:
                Response:

                Listing Doctors and with search (Frontend search):
                    
                    Doctors will be displayed in cards => Clicking on the card will display doctor details. (Filters: Based on Category (Cardiology, Opthomology, ENT, Dentist, etcc) and Availablility (Early morning, mornning, Afternoon, Night))
                    
                    API: to fetch doctors list
                        URL
                        Payload
                        response:
                    
                    Doctor Details:

                        What ever details in Add Doctor section to be displayed in single screen

                        API: To fetch Dotors details to be displayed
                        URL:
                        Payload:
                        Response:
            
                        Edit profile: 
                            URL
                            Payload
                            Response
                        Delete Profile
        Todays Logs:

            LIst of Todays patient check in and checkout

                URL:
                Payload:
                Response:

            View all: Same as user logs

                
        
    



Question:

How to handle checkout functionlity?
Socket is need for live comuincaition or polling?
Upload docs
How to do follow up for a paitent
Do we need to grop the docs by apointment wise?