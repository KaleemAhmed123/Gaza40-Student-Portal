# Gaza40Plus Resource Ownership Rules

This document outlines the ownership concepts and rules used within the Gaza40Plus platform.

> [!IMPORTANT]
> Ownership rules determine whether a user is eligible to access a resource before role-specific permissions are evaluated. A user must satisfy the ownership or scoping relationship constraints for a resource to qualify for role-based actions.

---

## Student Ownership

A student's profile, uploaded documents, chat history, application records, and personal settings are owned exclusively by that student.

Ownership is evaluated before role permissions.

Owning a resource does not automatically grant every operation. Business rules may impose additional restrictions based on the resource type and its current workflow status.

Examples:

* Verified identity documents (such as Passport and National ID) may become restricted from modification or deletion depending on the verification workflow.
* Students may edit their own approved Offer Letters. Any modification to an approved Offer Letter automatically returns it to the normal review and approval workflow.
* Students may view and download any document that belongs to them, subject to authentication and ownership validation.

---

## Mentor Assignment

Mentors never own student resources.

Instead, mentors receive delegated access through explicit assignment.

Removing the assignment immediately removes access.

Assignment never grants access to sensitive identity documents.

---

## Regional Ownership

Regional Administrators do not own student resources.

They receive administrative scope over resources belonging to students inside their assigned region.

Changing a student's region immediately changes Regional Admin visibility.

---

## Master Administration

Master Admin bypasses ownership and regional constraints.

However, backend authorization should still execute normally for auditing purposes.