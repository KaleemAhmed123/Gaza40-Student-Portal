# Gaza40Plus Document Access Control

This document governs the security and access policies applied to documents, file uploads, and attachment resources on the Gaza40Plus platform.

---

## 1. Guiding Security Principles

All development tasks modifying document handling, storage, or routing must adhere to these rules:

* **Backend Authorization is the Source of Truth**: All authorization, ownership, and scoping checks must be strictly enforced on backend endpoints. Frontend logic can be bypassed by malicious actors.
* **Frontend Only Controls Visibility**: Dynamic routing, hiding download buttons, and disabling upload selectors are UI enhancements to improve UX. They do not constitute actual security boundaries.
* **Scope and Ownership Precedes Role Checks**: For any document action request, the backend must first validate ownership or relationship scoping (i.e., whether the requester owns the file, is the assigned mentor, or administers the student's region) before assessing the role-based action privileges.
* **Storage URLs Must Never Bypass Authorization**: File storage pathways (such as private buckets or server upload folders) must not expose direct, static, unauthenticated URLs. All document downloads or previews must pass through authorization handlers or use secure, short-lived, pre-signed URLs generated after active session validation.

---

## 2. Access Rules by Role

### Student
* **View**: Authorized to view details of their own uploaded documents only. No access to other users' documents.
* **Preview**: Authorized to preview their own uploaded documents.
* **Download**: Authorized to download their own uploaded documents.
* **Upload**: Authorized to upload their own documents (Passport/National ID during profile onboarding; Offer Letters/Supporting Documents during placement registration).
* **Delete**: Authorized to delete their own uploaded Offer Letter and Supporting Documents, subject to status lock constraints (e.g., documents under active verification or already verified by an admin cannot be deleted without coordinator escalation).

### Mentor
* **View**: Authorized to view document details of assigned students only.
* **Preview**: Authorized to preview documents of assigned students only.
* **Download**: Authorized to download documents of assigned students only.
* **Upload**: Unauthorized to upload documents for students.
* **Delete**: Unauthorized to delete any student documents.
* *Note: Access is strictly restricted to Offer Letters and Supporting Documents. Access to Passport and National ID is entirely blocked.*

### Regional Admin
* **View**: Authorized to view document details of students in their assigned region only.
* **Preview**: Authorized to preview documents of students in their assigned region only.
* **Download**: Authorized to download documents of students in their assigned region only.
* **Upload**: Unauthorized to upload documents for students.
* **Delete**: Unauthorized to delete student documents directly (unless performing cleanup overrides within their region).
* *Note: Access is strictly restricted to Offer Letters and Supporting Documents. Access to Passport and National ID is entirely blocked.*

### Master Admin
* **View**: Fully authorized to view all document details for all students globally.
* **Preview**: Fully authorized to preview any document globally.
* **Download**: Fully authorized to download any document globally.
* **Upload**: Unauthorized to upload documents on behalf of students (unless using specific admin override portals).
* **Delete**: Fully authorized to delete any document across the system.
* *Note: Full access to all document types (Passport, National ID, Offer Letters, and Supporting Documents).*

---

## 3. Access Matrix by Document Type

| Document Type | Student | Mentor | Regional Admin | Master Admin |
| :--- | :--- | :--- | :--- | :--- |
| **Passport** | **Full Access**<br>*(Own document only)* | **No Access**<br>*(Blocked)* | **No Access**<br>*(Blocked)* | **Full Access**<br>*(Global view/delete)* |
| **National ID** | **Full Access**<br>*(Own document only)* | **No Access**<br>*(Blocked)* | **No Access**<br>*(Blocked)* | **Full Access**<br>*(Global view/delete)* |
| **Offer Letter** | **Full Access**<br>*(Own document only)* | **Read/Preview/Download**<br>*(Assigned students only)* | **Read/Preview/Download**<br>*(Regional students only)* | **Full Access**<br>*(Global view/delete)* |
| **Supporting Documents** | **Full Access**<br>*(Own document only)* | **Read/Preview/Download**<br>*(Assigned students only)* | **Read/Preview/Download**<br>*(Regional students only)* | **Full Access**<br>*(Global view/delete)* |