Notification trigger scenarios:

1. For all the patients 2hours before their booking slot => your appointment to be start in 2 hours
2. For a day, for a doctor have many time slots, for ex if time slot 9 to 11 am and it have 20 appointment is booked,
    then, we need to trigger the notication in batches 5 per batch,
    for those 5 people based on the their location and the hospital location if the distacne taken to reach there is x min then need to send the notication before x+5 min saying if u start now u can reach hospital in x + 5 min
3. Lets say doctor have a slot 9 to 11 due to some emergency he may put like he is occupied for next 30 min or 60 min,
    in the case we need to send the updated notication to the patients sayin there is a delay with the doctor due to some emergency x min , if u want to rescuhel the appointment then u can procced with next slot, and ther shuld be action items for reschduing
4. Need to trigger the 2nd batch of notication once the first person checked in in hte 1st batcch,

5. If some person not been arraived then maximum wait time for the person is 10 min then the appointment considered as not arraived and then next set of batch trigger should be triggered,
    

### **User App**

**High**

1. About and Services are not reflecting in the hospital detail screen when clicking the hospital card in the dashboard.
2. Integrate map route functionality.

**Medium**
3. When adding a new address, the updated address appears only after refreshing the screen.
4. Remove the edit option in the “Review Appointment” screen — the address change edit button is currently non-functional, so remove it.
5. After booking, display the token number below the booking user ID in the appointment confirmation screen.

**Low**
6. Remove star rating and distance from the hospital card in the dashboard.
7. Explore adding a share option in the appointment confirmation screen.


### **Admin App**

**High**

1. While entering address details during onboarding, ensure latitude and longitude are stored in the `location.coordinates` array in `[longitude, latitude]` format. (Currently being sent as `0,0`; note: longitude comes first.)
2. Edit Doctor screen is appearing blank.
3. Service start date field in the “Add Nurse” form is not editable.
4. Availability.
5. Follow-up.

**Medium**
6. Reschedule.

**Low**
7. Display token ID in place of user ID wherever it appears in the Admin app (or confirm if this should be handled in the backend).
8. Driver license support.




Vimal:

Need to send the Dashboad data in sorted format form the users home location
Block the slot selection => properly
Verify u sending token number for the apping booking api
When we click all appoinmnt, the appoinmnt status need to be handled in api, api status to be shown
Avaialability



---------------------------------------------------***************----------------------------


Final List: Oct 18 2025

User app:

1. In Login we have Checkbox reach out to me on whats app checkbox -> shall we remove -> low
2. OTP sent successfully , Login successfull popup, Account Created successfully, Profile updated successfully styles (toster in top or bottom) -> low
3. Map is now hardcoded location -> High
    Hide The map in the profile - Hold this as of now
    Will send the notification, Clicking it -> should start the navigation, i will send the hosptial details to navigate and the origin from which navigate starts
4. In Dark mode profile section icons - Medium
5. User tokenDisplay instead of token number in all the places - Medium


6. Featured and top rated UI need to be finetuned. -> include distance and timing from api
7. All appoints need to display the stats completed , upcoming based on the backend flag





Admin app:

1. Maxtoken and unlimited token in hospital onboarding, not needed -> Low (Will confirm Hold this till then)
2. Time Picker alignment - Low
3. Hopital about and services in not reflecting when i add form the on boarding, in profile only after updating the profile section it is saved and reflecting, it should hardcoded date => Medium
4. While adding timeline for doctors, once we enter and if we open again then show the pre selected time
5. User tokenDisplay instead of token number in all the places - Medium
6. Filters in today's log is not functional
7. Add dynamic doctor id instaed of the hardcoded doctor id in the folloup - Hign
8. Doctor delete and Nurse delete in throwing error - High
9. Location coordiantes to be sent to Hospitan onbarding api (Long, Lat) - High
10. Checkout screen UI - Low
11. Nurse Documnet screen is not needed - Low
12. Remove the notification icon in admin app header - High
13. Any session menitoned for admin -> app is getting logged out => fine => but need to show the popup bfore loggng out  => medium
14. By default the Create new accout and Login in comming in dark mode after toggling the dark and light mode app theme applied correctly - Low


15. Follow ups is not needed the Chceked in screen after checking in via scannser
16. In Dashboard Checkin is clickable and if i click there is no data even after checkin in => Medium






Backend:

1. Support proof Driving Liscence and Voter ID - Done
2. Provid the location of the hosptial relative to the user defalut address with the hosptial, details, sort and send based on the km. - Done
3. Need to give Doctor id in teh checkout scanner api - Done
4. Return the token number for the appointment api - Done
5. Block appointment booking per future slots only
6. Block the Scanner to not scan the QR wich is past
7. Deleting the Admin not deleteing the nurse.



Infra checklist:

1. Enable live OTP
2. Setup mongoDb live server
3. IOS build


Cleanup Checklist:

1. Clean up DB


Quesitions:

1. What is the use of Hosptial timing, type and tokens in hospitals?
2. What is the use of Doctor type?


Test checklist:

1. User onboarding
2. User profiles and updates

3. Admin onboarding
4. Admin profiles and updates

5. Onboard hospital 
6. Approve the hosptial onboarding
7. Make the hosptial hold  = Super admin portal

8. Add doctor
9. Update doctor

10. Add nurse
11. Update nurser

12. Booking the hospital by user in the user app
13. Check the appoinments in the admin app

14. Scan the appointment scanner (Scan by Admin, Nurse, Docotor) => Appointment status to be shown as Checked In

15. Second time when we scan the same scanner need to show as checked out
16. Upload the Consultation document 
17. Create a followup appointment 

18. View consulted prescriptoin in the user app
19. View Followup in hte user app

20. Permission based handling in the admin app.

21. Notification + map validation



Edge case checklist


Enhancements:


Once booked the appinement notification will come => clicking on that can we opone the appintment?
