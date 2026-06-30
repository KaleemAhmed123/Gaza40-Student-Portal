# Gaza40Plus RBAC Common Scenarios

This document provides common authorization scenarios used throughout Gaza40Plus.

These examples illustrate how authorization decisions should be evaluated using the platform's RBAC model.

Every authorization decision should follow the standard evaluation order:

1. Authentication
2. Role
3. Ownership / Assignment / Regional Scope
4. Resource Type
5. Requested Action
6. Business Rules
7. Authorization Result

---

# Scenario 1

## Student previews or downloads their own Passport

### Evaluation

1. Authenticated
2. Role = Student
3. Ownership = Own document
4. Document Type = Passport
5. Action = Preview or Download

### Result

✅ Allow

Students may preview and download any document that belongs to them.

---

# Scenario 2

## Student attempts to preview or download another student's Passport

### Evaluation

1. Authenticated
2. Role = Student
3. Ownership = Failed

### Result

❌ Deny

Ownership validation fails before role permissions are evaluated.

---

# Scenario 3

## Mentor previews or downloads an assigned student's Offer Letter

### Evaluation

1. Authenticated
2. Role = Mentor
3. Assignment = Valid
4. Document Type = Offer Letter
5. Action = Preview or Download

### Result

✅ Allow

Mentors may preview and download Offer Letters belonging to their assigned students.

---

# Scenario 4

## Mentor previews or downloads an assigned student's Financial Document

### Evaluation

1. Authenticated
2. Role = Mentor
3. Assignment = Valid
4. Document Type = Financial Document
5. Action = Preview or Download

### Result

✅ Allow

Financial Documents are accessible only for assigned students.

---

# Scenario 5

## Mentor attempts to preview or download an assigned student's Passport

### Evaluation

1. Authenticated
2. Role = Mentor
3. Assignment = Valid
4. Document Type = Passport

### Result

❌ Deny

Identity document should not be visible to mentors on the UI and Mentors are not permitted to access identity documents.

---

# Scenario 6

## Regional Admin previews or downloads a student's Offer Letter

### Evaluation

1. Authenticated
2. Role = Regional Admin
3. Regional Scope = Valid
4. Document Type = Offer Letter
5. Action = Preview or Download

### Result

✅ Allow

Regional Admins may access Offer Letters belonging to students within their assigned region.

---

# Scenario 7

## Regional Admin previews or downloads a student's Financial Document

### Evaluation

1. Authenticated
2. Role = Regional Admin
3. Regional Scope = Valid
4. Document Type = Financial Document
5. Action = Preview or Download

### Result

✅ Allow

Financial Documents are accessible only for students within the Regional Admin's assigned region.

---

# Scenario 8

## Regional Admin attempts to preview or download a student's Passport

### Evaluation

1. Authenticated
2. Role = Regional Admin
3. Regional Scope = Valid
4. Document Type = Passport

### Result

❌ Deny

Identity document should not be visible on the UI. Regional scope does not override document type restrictions.

---

# Scenario 9

## Master Admin previews or downloads any student document

### Evaluation

1. Authenticated
2. Role = Master Admin
3. Document Type = Any
4. Action = Preview or Download

### Result

✅ Allow

Master Admin has unrestricted access to all document types across the platform.

---

# Scenario 10

## Student uploads an Offer Letter

### Evaluation

1. Authenticated
2. Student owns the target account
3. Upload target belongs to the authenticated student
4. Document validation succeeds

### Result

✅ Allow

Students may upload documents only to their own account.

---

# Scenario 11

## Mentor attempts to upload a student's documents

### Evaluation

1. Authenticated
2. Role = Mentor

### Result

❌ Deny

Mentors cannot upload documents on behalf of students.

---

# Scenario 12

## Direct access using a document URL

### Evaluation

1. Request bypasses the application UI.
2. Backend validates authentication.
3. Backend validates ownership, assignment, or regional scope.
4. Backend validates document type permissions.
5. Backend validates the requested action.

### Result

Authorization is determined exclusively by the backend.

Possessing or guessing a document URL never grants access.