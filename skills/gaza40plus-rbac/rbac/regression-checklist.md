# Gaza40Plus RBAC Regression Checklist

This checklist is to be used by developers and reviewers during feature code reviews before merging any pull requests that affect authorization, routing, data models, or user access scopes.

---

## 1. Core Authentication & Authorization

* `[ ]` **Authentication Validation**
  * Verify that unauthenticated requests to protected endpoints are blocked and return `401 Unauthorized`.
  * Ensure that expired, tampered, or invalid session tokens are rejected.
  * Verify that headers, cookies, or authorization tokens are transmitted securely and validated on every request.

* `[ ]` **Role Authorization & Access Control**
  * Check that endpoints permit only the defined roles (Student, Mentor, Regional Admin, Master Admin).
  * Verify that role hierarchies function correctly (e.g., higher-privilege roles inherit necessary actions without bypassing scoping checks).
  * Ensure that any role check mismatch is rejected with `403 Forbidden`.

* `[ ]` **Privilege Escalation Mitigation**
  * Confirm that a user cannot upgrade their own role or permissions by modifying the request body, headers, or token payload.
  * Check that only Master Admins can update user roles or permissions.

---

## 2. Resource Scoping & Relationships

* `[ ]` **Direct Ownership Verification**
  * Test that users can read, update, or delete only resources that they own (e.g., student editing their profile, adding query comments).
  * Ensure that altering the resource ID or target user ID parameter in the API payload results in an access block (protecting against Broken Object-Level Authorization - BOLA).

* `[ ]` **Mentor Assignment Constraints**
  * Verify that Mentors can access profiles, chat logs, and permitted documents of assigned students only.
  * Ensure a Mentor attempting to query details or documents of a student they are not assigned to is denied access with `403 Forbidden`.

* `[ ]` **Regional Scope Boundaries**
  * Check that Regional Admins are confined to data, students, mentors, and queries belonging to their assigned region.
  * Test that cross-regional requests (e.g. Regional Admin querying a student profile from another region) are blocked.

* `[ ]` **Student Isolation Protection**
  * Confirm that Student accounts have zero visibility into any other student's profile, uploads, applications, or chat streams.
  * Verify that no API endpoint accidentally leaks arrays containing peer student records.

* `[ ]` **Master Admin Global Access**
  * Verify that Master Admins retain unrestricted global access to all records across all regions.
  * Ensure that no regional or relationship filters accidentally block Master Admin queries or management tasks.

---

## 3. Document Access Control

* `[ ]` **Document Upload Boundaries**
  * Confirm that Students can upload documents only to their own accounts.
  * Ensure that file uploads restrict target paths to prevent writing to other users' directories or overriding global system assets.

* `[ ]` **Approved Offer Letter Edit Workflow**

  * Verify that Students can edit their own approved Offer Letters.
  * Confirm that editing is restricted to the owner of the Offer Letter.
  * Verify that any modification automatically changes the Offer Letter status back to the appropriate review state.
  * Ensure that previously granted approval does not remain valid after the document has been modified.
  * Confirm that Mentors and Regional Admins see the updated Offer Letter only after the normal review workflow resumes.
  * Verify that editing an approved Offer Letter does not bypass validation, approval, or audit requirements.


* `[ ]` **Document Preview Security**
  * Verify that the preview endpoint enforces active session ownership/scoping checks.
  * Confirm that the UI preview components do not expose raw file locations or credentials in client-side logs.

* `[ ]` **Document Download Security**
  * Check that downloading files requires authorization and validation.
  * Verify that files are served via short-lived, pre-signed URLs or authorized stream proxies.
  * Confirm that Passport and National ID documents remain inaccessible to Mentors and Regional Admins, while Offer Letters and Financial Documents remain accessible only within their permitted assignment or regional scope.

* `[ ]` **Unauthorized URL Access Prevention**
  * Verify that copying and pasting direct document URLs or API paths into an unauthenticated browser session results in access being blocked.

---

## 4. API & Interface Alignment

* `[ ]` **API Endpoint Authorization Coverage**
  * Verify that every new endpoint is decorated with authentication and authorization middleware.
  * Confirm that there are no "backdoor" routes left open for testing or development purposes.

* `[ ]` **Frontend Visibility Synchronization**
  * Verify that the UI hides or disables options, menus, and actions (e.g., download/upload buttons, admin dashboard tabs) according to the user's role.
  * Confirm that the application does not crash when the backend returns a `403 Forbidden` for a restricted resource, but instead displays a clean access-denied state.
