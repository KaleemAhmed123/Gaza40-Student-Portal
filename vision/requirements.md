Software Requirements & Specification (SRS) 

Project Name: Gaza40+ Student Offer Management Portal Version: 2.0 Date: 14 May, 2026 

1. Introduction 

1.1 Purpose 

The Gaza40+ Student Portal is a web application designed to streamline the collection, management, and tracking of university offers for Palestinian students from Gaza. It serves as a centralized hub for student data, documentation, financial capability tracking, and communication with the Gaza40+ administrative team. 

1.2 Scope 

The MVP will focus on a bilingual (English/Arabic) user interface, comprehensive student onboarding (demographics, passports, location verification), core data entry for university offers, automated financial capability calculations, an Alert System, and an Admin Dashboard with desired filter features and CSV export capabilities. 

2. User Roles 

Student: The primary user. Can log in, complete their profile, add/edit/remove university offers, upload necessary documents, and raise alerts. 

Master Admin: Gaza40+ staff/volunteers. Can view the entire database of students, export data to CSV, and monitor/resolve student alerts. 

Regional Admins: Gaza40+ works for securing offers in multiple countries. Each country will have a regional admin, who will have access to only that portion of database which contains offers in that country, , export data to CSV, and monitor/resolve student alerts. There can also be more than one admin. 

Mentor/Volunteer: For the volunteers there will be a very diluted view. They will be able to monitor the alerts assigned to them by global admins. Talk with students resolve it. 

3. Use Registration: There will be three options: SIGN UP AS A STUDENT/SIGN UP AS A VOLUNTEER/LOGIN) 

4. Student View (Side Bar: Announcements/Offers/Queries/University processes/Scholarships/Profile): 

4.1 Localization & Accessibility (i18n) 

REQUIREMENT-4A: The application must support both English and Arabic. 

REQ-4B: A global toggle must be available in the navigation bar to switch languages. 

REQ-4C: When Arabic is selected, the User Interface must automatically switch to a Right-to-Left (RTL) layout. 

4.2 Authentication & Comprehensive Student Profile AKA Registration 

Upon registration, students must complete a comprehensive profile. System Rule: Students must indicate they are located in Gaza; the system will not process registrations for students residing outside of Gaza. 

Profile Data Fields: 

Personal Information: 

Full Name in English (As it appears on the Passport) 

Email Address 

Sex (Dropdown: Male, Female) 

Date of Birth (Date picker) 

Copy of National ID (File upload: .pdf, .jpg, .png) 

Have University offers (Y/N). (referred again later) 

Current Location (Gaza Only): 

Location in Gaza (Dropdown: Deir Al Balah, Bureij, North Gaza, Gaza City, Nuseirat, Zawaidah, Maghazi, Khan Yunis, Other - If 'Other' is selected, a text input appears). 

Passport Details: 

Passport Status (Dropdown: Valid, Valid but expires within an year, Invalid/Lost/Never had one) 

Copy of Passport (File upload: .pdf, .jpg, .png)(If any) 

Passport Location (Dropdown: In Gaza with me, Egypt, Ramallah, Jordan, Other - If 'Other', text input appears). 

Emergency Contact: 

First Name 

Relation 

Phone Number 

English Proficiency Tracking 

Within the student profile, users must outline their English language qualifications: 

Medium of Instruction (MOI) / Studied Bachelor in English? (Radio: Yes / No) 

If Yes: Upload MOI Letter (File upload) and Enter name of Bachelor University in Gaza (Text input). 

If employed, can you get English proficiency certificate from workplace? (Radio: Yes / No) 

Other English Certifications? (Text input to specify, e.g., Duolingo, IELTS). 

Consent & Compliance 

REQ-4D: Before finalizing their profile, students must be presented with the Gaza40+ Consent Form. 

REQ-4E: The UI must provide a "Download Consent Form" button. 

REQ-4F: The UI must provide an "Upload Signed Consent Form" input (File upload). Profile submission is blocked until this is uploaded. 

IMPORTANT: After student gets registered, the main page will show “Profile under review, once done you will have access to your account. It might take 2-3 days.” An alert will be sent to the master admins. 

4.3 Offer Management  

Students have a dashboard displaying their offers as title (As the developer sees good to be displayed). They can "Add New Offer", "Edit", or "Remove" them. 

If the student has chosen ‘Yes’ for “Have uni offer’ field during registration, then student needs to add at least a single offer. 

University Details: University Country (Dropdown: as of now UK, Ireland, Italy, Spain, Egypt, US, Bosnia, Turkey), University Name (Searchable Dropdown/Autocomplete). 

Course Details: Course Name, Course field (Dropdown: Medicine, Engineering, Pure Sciences, Arts), Course Level (Dropdown: Residential Independent School, Foundation + Bachelor, Bachelor, Integrated Master, Master, PhD), Duration of Course (Number in years), Programme Start Date (Date picker). 

Offer Status: Offer Type (Conditional, Unconditional, Deferred, Rejected), Conditions (Text area - if Conditional), Degree Offer Letter (File Upload). 

Financial Details: (referred again) 

Course Tuition Fees per year (Numeric) 

Source of Course fee: (Link) 

Has Scholarship? (Yes/No) -> If Yes: Name of scholarship, Amount per year, Scholarship Letter Upload. 

Scholarship covers living cost? (Y/N) (referred again later) 

Private Funding Amount (Numeric) 

Explain Source of private funding. (Text) 

Dynamic Financial Calculations (need to be displayed automatically in the Financial Details section) 

The system automatically calculates funding gaps based on UK visa requirements. 

Living Costs Location: 

If university is in London: Calculates living cost as £13,761*duration of course in complete years. (Complete year meaning, if a student says his course is 2.5 years, then duration of course in complete years is 2.) 

Outside London: Calculates living cost as £10,539*duration of course in complete years 

If the university is outside UK: Opens numeric field for “Living costs for VISA.” 

If it is a Residential Independent School: Opens manual numeric input for “boarding fees”. 

REQ-4G (Tuition Check): Total funds required: (Scholarship + Private Funding) >= Course Tuition Fees. 

REQ-4H (Living Cost Check): System checks: 
if REQ-4G is true, then checks whether excess amount >=living cost: 

Display  Living cost covered. 

If if REQ-4G is true, then checks whether excess amount <living cost: 

Display “living cost - excess amount” is required. 

 if REQ-4G is false: 

Display  “Living cost” is required. 

Also if student choses ‘Yes’ for Scholarship covers living costs then system automatically checks yes here. 

IMPORTANT: After student enters a new offer, the offer appears as a locked tile with status : “Offer under review, once done you will have access to it. It might take 2-3 days.” In this scenario an alert will be sent to the regional admins. 

If the student makes edit/changes in the existing approved offers, then offer gets locked again and goes under review. An alert will be raised to the regional admin. Then, he assigns a mentor. The fields changed/edited will be highlighted then the mentor confirms and approves those field. 

4.4 Queries Management Tab 

REQ-4I: Students can trigger an alert from their dashboard. Categories: 

"I am facing an issue with my visa/offer." (Text box for details). 

Select the country of offer(dropdown). 

"I have not been added to the WhatsApp group for [Select University]." 

(Specific Volunteer) 

[Will tell more later after asking team] 

4.5 Announcements Tab 

REQ-4J: Students will be able to see the announcements about scholarships/deadlines/passports/webinars/miscellaneous things here made by admins. So, design it accordingly. IT IS GLOBAL.  

4.6 University Processes Tab: (CAN BE MADE LATER, NOT NEEDED URGENTLY) 

REQ-4K: This section will contain a text like : “Please select the country to see the admission processes in its universities” then high level list of country names. After a student clicks the country name, a new page opens with the name of universities, there is also a capability to search a specific university name. Clicking a particular uni name will open another page containing details about the processes. 

4.6 Scholarships Processes Tab: (CAN BE MADE LATER, NOT NEEDED URGENTLY) 

REQ-4L: The requirement is same as that of REQ-4K. 

4.6 Profile Tab 

REQ-4M: All the details filled during the registration will be displayed here. (If a student selects he has no offer at the time of registration. In future he gets new verified offer, then this button becomes yes.) 

5 Master Admin Dashboard (Side bar: Announcements/Students/Volunteers /offers /Queries) 

5.1 Announcements page: 

REQ-5A: It will display the existing announcements and add new announcements. Also, options to edit/delete existing announcements. 

 

5.2 Student page: 

REQ-5B: Displays a master grid of all registered students, their profile statuses (Consent signed, Passport valid), and capability to aggregate them based on fields in students’ registration like passport status, Location in Gaza, and so on. IMPORTANTLY, One-click export of the entire/filtered database(including URL links to uploaded files) into a CSV file. 

5.3 Volunteers page: 

REQ-5C: Displays a master grid of all registered volunteers, their profile statuses (Consent signed), the roles they have (regional admins/mentor), and capability to aggregate them based on fields in the volunteer registration form. 

5.4 Offers page: 

REQ-5D: Display the a list of countries on the main page. Upon selecting the country, a master grid opens for all the offers in that country. Features to do filtering across various fields in forms. Also aggregate offers on various fields like offer type(conditional/unconditional), university, funding type (fully funded/can cover living costs?/no funding). IMPORTANTLY, One-click export of the entire/filtered database(including URL links to uploaded files) into a CSV file. 

5.5 Queries page: 

REQ-5E: Centralized view of all active alerts, timestamps, and student emergency/contact info. Also feature to message any particular student or volunteer. Admins can mark as "Resolved". 

6 Regional Admin Dashboard (Side bar: Announcements/Students/Volunteers /offers /Queries) 

6.1 Announcements page: 

REQ-6A: Similar to REQ-5A. 

6.2 Student page: 

REQ-5B: Displays a master grid of all students having offers in that region, the information here is limited only to student names, date of birth, phone number, email. 

6.3 Volunteers page: 

REQ-6C: Displays a master grid of all registered volunteers in that region, the information here is limited only to name, date of birth, phone number, email. Moreover, a feature to assign them roles here.  

6.4 Offers page: 

REQ-6D: Displays a master grid opens for all the offers in that country. Features to do filtering across various fields in forms. Also aggregate offers on various fields like offer type(conditional/unconditional), university, funding type (fully funded/can cover living costs?/no funding). IMPORTANTLY, One-click export of the entire/filtered database(including URL links to uploaded files) into a CSV file. 

6.5 Queries page: 

REQ-6E: Centralized view of all active alerts, timestamps, and student emergency/contact info. Also feature to message any particular student or volunteer. Admins can mark as "Resolved". 

7 Mentor/Volunteer Dashboard (Side bar: Announcements/Students/Queris/profile  

7.1 Announcements page: 

REQ-7A: Similar to REQ-5A. Needs approval from the master/regional admins. 

7.2 Student page: 

REQ-7B: Displays tiles of student names. Upon clicking which volunteer can start a chat with the student. Resolve the query. Chat button. After approval the tile of student disappears. 

7.3 Queries page: 

REQ-7C: Display the queries assigned by admins. An option to accept and work on it. Upon accepting, a student tile has been created on the student page and mentor starts a chat with the student on the Student page. All the chat summaries remain stored in the ticket for the overview of the admins. Once resolved, a button to indicate that query has been resolved. Upon clicking it, the  

 

4. Non-Functional Requirements 

Data Security & Privacy: All file uploads (ID, Passport, Consent, Offer Letters, MOI) must be securely stored in private cloud buckets (e.g., AWS S3, Firebase Storage) with authenticated read access only. 

File Validation: Strict client-side and server-side validation to allow only .pdf, .jpeg, .jpg, .png files. Maximum file size limits should be enforced (e.g., 5MB per file) due to poor internet connectivity in Gaza. 

Mobile Responsiveness: UI must be mobile-first and fully responsive, accommodating smaller screens and low bandwidth. 

5. Data Schema (High-Level) (Some schema might be missing so create accordingly) 

This is client given we can better break into table don't overengineer smaller normalization
Users (Students) Table: 

id (UUID) 

email, password_hash 

full_name_english, sex, dob 

location_in_gaza, location_other 

id_document_url 

passport_status, passport_url, passport_location, passport_location_other 

emergency_contact_name, emergency_contact_relation, emergency_contact_phone 

english_moi_yes_no, moi_letter_url, bachelor_uni_gaza 

english_workplace_yes_no, english_other_certs 

consent_form_url 

created_at, updated_at 

Offers Table: 

id, student_id (FK) 

uni_name, uni_country, course_name, course_level, duration_months, start_date 

offer_type, conditions, offer_letter_url 

tuition_fee, scholarship_amount, scholarship_name, scholarship_letter_url, private_funding 

living_cost_location 

Alerts Table: 

id, student_id (FK) 

alert_type, message, status (open/resolved), created_at 