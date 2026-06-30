# Gaza40Plus Authorization & Permission Model

This document defines the authorization model used throughout the Gaza40Plus platform.

It describes **how authorization decisions are made**, not the specific permissions assigned to each role.

Role definitions are maintained in `roles.md`.

Document permissions are maintained in `document-access.md`.

---

# Authorization Decision Flow

Every protected request should be evaluated in the following order.

```
Authentication
        ↓
Role
        ↓
Ownership
        ↓
Assignment
        ↓
Regional Scope
        ↓
Resource Type
        ↓
Requested Action
        ↓
Business Rules
        ↓
Backend Enforcement
        ↓
Response
```

---

# 1. Authentication

Authentication verifies the identity of the requester.

Before evaluating any permissions the backend must confirm:

* the request contains a valid authenticated session
* the session has not expired
* the identity has not been tampered with

If authentication fails:

Return **401 Unauthorized**.

No additional permission checks should execute.

---

# 2. Role

Once identity is verified, determine the acting role.

Current system roles include:

* Student
* Mentor
* Regional Admin
* Master Admin

The role defines the maximum possible permissions available to the user.

Roles alone never grant access.

---

# 3. Ownership

Ownership determines whether the user is eligible to interact with a resource.

Examples include:

* Student owns their own profile.
* Student owns their uploaded documents.
* Student owns their submitted queries.

Ownership is always evaluated before role permissions.

---

# 4. Assignment

Some permissions are delegated rather than owned.

Example:

A Mentor gains access only because a student has been assigned to them.

Removing the assignment immediately removes access.

Assignment never replaces ownership.

---

# 5. Regional Scope

Administrative access is limited by regional boundaries.

Regional Admins may only access resources belonging to their assigned region.

Regional scope is evaluated before permission checks.

---

# 6. Resource Type

Authorization depends on the resource being accessed.

Examples include:

* Student Profile
* Offer
* Document
* Query
* Chat
* Announcement
* Notification

Different resource types may require different permission rules.

---

# 7. Requested Action

Every request represents an action.

Typical actions include:

* Create
* Read
* Update
* Delete
* Preview
* Download
* Approve
* Reject
* Assign

Permission evaluation always considers both the resource type and the requested action.

---

# 8. Business Rules

Business rules may impose additional restrictions or workflow transitions after permissions have been evaluated.

Authorization determines **whether** a user may perform an action. Business rules determine **how** that action affects the resource.

Examples include:

* Verified identity documents (such as Passport and National ID) may become restricted from modification or deletion according to the verification workflow.
* Students are permitted to edit their own approved Offer Letters. Any modification automatically resets the Offer Letter to the standard review workflow and requires re-approval.
* Certain workflow states may temporarily restrict actions until the current review or verification process is completed.
* Business rules must never weaken authorization or bypass ownership, assignment, or regional scope validation.

Business rules complement authorization but never replace it.


---

# 9. Backend Enforcement

The backend is the authoritative source for authorization.

Every protected endpoint must validate:

* Authentication
* Role
* Ownership
* Assignment
* Regional Scope
* Business Rules

Frontend validation is never sufficient.

---

# 10. Frontend Visibility

The frontend should improve user experience by:

* hiding unauthorized actions
* disabling unavailable buttons
* preventing navigation to restricted pages

Frontend visibility is not a security mechanism.

Backend authorization must always be enforced even if the frontend hides functionality.
