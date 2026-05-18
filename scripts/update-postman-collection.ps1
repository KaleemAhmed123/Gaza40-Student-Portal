$collectionPath = "Gaza40+ API.postman_collection.json"
$collection = Get-Content -Raw $collectionPath | ConvertFrom-Json

$collection.item = @($collection.item | Where-Object {
  $_.name -ne "11 Admin Students Grid" -and
  $_.name -ne "13 Admin Students Grid" -and
  $_.name -ne "12 Admin Volunteers Grid" -and
  $_.name -ne "14 Admin Volunteers Grid" -and
  $_.name -ne "08 Queries / Ticketing" -and
  $_.name -ne "09 Admin Queries" -and
  $_.name -ne "10 Mentor Queries"
})

function New-Header($key, $value) {
  [ordered]@{ key = $key; value = $value; disabled = $false }
}

function New-Url($raw) {
  $withoutBase = $raw -replace '^\{\{baseUrl\}\}/?', ''
  $parts = @()
  $query = @()

  $pathPart = $withoutBase
  if ($withoutBase.Contains("?")) {
    $split = $withoutBase.Split("?", 2)
    $pathPart = $split[0]
    $query = $split[1].Split("&") | ForEach-Object {
      $kv = $_.Split("=", 2)
      [ordered]@{ key = $kv[0]; value = if ($kv.Count -gt 1) { $kv[1] } else { "" } }
    }
  }

  if ($pathPart) {
    $parts = $pathPart.Split("/") | Where-Object { $_ -ne "" }
  }

  $url = [ordered]@{
    raw  = $raw
    host = @("{{baseUrl}}")
    path = @($parts)
  }

  if ($query.Count -gt 0) {
    $url.query = @($query)
  }

  return $url
}

function New-CookieCaptureEvent($variableName) {
  [ordered]@{
    listen = "test"
    script = [ordered]@{
      type = "text/javascript"
      exec = @(
        "const setCookie = pm.response.headers.get('Set-Cookie');",
        "if (setCookie) {",
        "  pm.collectionVariables.set('$variableName', setCookie.split(';')[0]);",
        "}"
      )
    }
  }
}

function New-Request($name, $method, $rawUrl, $description, $cookieVariable, $body = $null, $testEvent = $null) {
  $headers = @()
  if ($cookieVariable) {
    $headers += New-Header "Cookie" $cookieVariable
  }

  $request = [ordered]@{
    method      = $method
    header      = @($headers)
    url         = New-Url $rawUrl
    description = $description
  }

  if ($body) {
    $request.header += New-Header "Content-Type" "application/json"
    $request.body = [ordered]@{
      mode    = "raw"
      raw     = $body
      options = [ordered]@{
        raw = [ordered]@{ language = "json" }
      }
    }
  }

  $item = [ordered]@{
    name     = $name
    request  = $request
    response = @()
  }

  if ($testEvent) {
    $item.event = @($testEvent)
  }

  return $item
}

function New-Folder($name, $items) {
  [ordered]@{
    name = $name
    item = @($items)
  }
}

function Set-Folder($name, $items) {
  $folder = $collection.item | Where-Object { $_.name -eq $name -and $_.item } | Select-Object -First 1
  if ($folder) {
    $folder.item = @($items)
    return
  }

  $collection.item += New-Folder $name $items
}

function Remove-TopLevelRequests($names) {
  $collection.item = @($collection.item | Where-Object { -not ($_.request -and $names -contains $_.name) })
}

$studentGridNames = @(
  "Admin Students - List All Students",
  "Admin Students - Search",
  "Admin Students - Filter By Profile Status",
  "Admin Students - Filter By Passport Status",
  "Admin Students - Filter By Gaza Location",
  "Admin Students - Filter By Verified Offer",
  "Admin Students - Filter By Signed Consent",
  "Admin Students - Combined Filters With Pagination",
  "Regional Admin Students - Students With Offers In Regional Admin's Offer Region",
  "Regional Admin Students - Search Within Regional Offer Students"
)

Remove-TopLevelRequests $studentGridNames

$authItems = @(
  New-Request "Register Student" "POST" "{{baseUrl}}/api/auth/register/student" "Registers a student account, creates the student profile, and captures the student cookie in `studentCookies`." $null "{`n  `"email`": `"student@example.com`",`n  `"password`": `"Password123!`",`n  `"fullName`": `"Ahmed Ali`",`n  `"hasOfferSelfReported`": false`n}" (New-CookieCaptureEvent "studentCookies")
  New-Request "Register Volunteer" "POST" "{{baseUrl}}/api/auth/register/volunteer" "Registers a volunteer/mentor account and captures the volunteer cookie in `volunteerCookies`." $null "{`n  `"email`": `"volunteer@example.com`",`n  `"password`": `"Password123!`",`n  `"fullName`": `"Sara Hassan`",`n  `"phone`": `"+970591234567`",`n  `"universityAffiliation`": `"University of Gaza`"`n}" (New-CookieCaptureEvent "volunteerCookies")
  New-Request "Login Student" "POST" "{{baseUrl}}/api/auth/login" "Logs in as the sample student and captures `studentCookies`." $null "{`n  `"email`": `"student@example.com`",`n  `"password`": `"Password123!`"`n}" (New-CookieCaptureEvent "studentCookies")
  New-Request "Login Volunteer" "POST" "{{baseUrl}}/api/auth/login" "Logs in as the sample volunteer/mentor and captures `volunteerCookies`." $null "{`n  `"email`": `"volunteer@example.com`",`n  `"password`": `"Password123!`"`n}" (New-CookieCaptureEvent "volunteerCookies")
  New-Request "Login Master Admin" "POST" "{{baseUrl}}/api/auth/login" "Logs in as the seeded development Master Admin and captures `adminCookies`." $null "{`n  `"email`": `"admin@example.com`",`n  `"password`": `"AdminPassword123!`"`n}" (New-CookieCaptureEvent "adminCookies")
  New-Request "Login Regional Admin" "POST" "{{baseUrl}}/api/auth/login" "Logs in as the seeded development UK Regional Admin and captures `regionalCookies`." $null "{`n  `"email`": `"regional.uk@example.com`",`n  `"password`": `"RegionalPassword123!`"`n}" (New-CookieCaptureEvent "regionalCookies")
  New-Request "Get Current User" "GET" "{{baseUrl}}/api/auth/me" "Returns the current user from Postman's active cookie jar. Role-specific folders use captured Cookie variables." $null
  New-Request "Logout" "POST" "{{baseUrl}}/api/auth/logout" "Clears the active auth cookie in Postman's cookie jar." $null
  New-Request "Forgot Password" "POST" "{{baseUrl}}/api/auth/forgot-password" "Sends reset link if the email exists. Response is intentionally generic." $null "{`n  `"email`": `"student@example.com`"`n}"
  New-Request "Reset Password" "POST" "{{baseUrl}}/api/auth/reset-password" "Reset password using token from email link." $null "{`n  `"token`": `"{{resetToken}}`",`n  `"password`": `"NewPassword123!`"`n}"
  New-Request "Send Verification Email" "POST" "{{baseUrl}}/api/auth/send-verification-email" "Authenticated user: send email verification link." "{{studentCookies}}" "{`n  `"redirectPath`": `"/verify-email`"`n}"
  New-Request "Verify Email" "POST" "{{baseUrl}}/api/auth/verify-email" "Verify email using token from email link." $null "{`n  `"token`": `"{{verificationToken}}`"`n}"
)
Set-Folder "01 Auth" $authItems

$dashboardItems = @(
  New-Request "Student Dashboard" "GET" "{{baseUrl}}/api/student/dashboard" "Student: profile status, offer/query counts, recent items, and latest announcements." "{{studentCookies}}"
  New-Request "Admin Dashboard (Master Admin)" "GET" "{{baseUrl}}/api/admin/dashboard" "Master Admin: global counts and recent items." "{{adminCookies}}"
  New-Request "Admin Dashboard (Regional Admin)" "GET" "{{baseUrl}}/api/admin/dashboard" "Regional Admin: region-scoped counts and recent items." "{{regionalCookies}}"
  New-Request "Mentor Dashboard" "GET" "{{baseUrl}}/api/mentor/dashboard" "Mentor: assigned query counts and recent assigned queries." "{{volunteerCookies}}"
)
Set-Folder "16 Dashboards" $dashboardItems

$studentGridItems = @(
  New-Request "List All Students (Master Admin)" "GET" "{{baseUrl}}/api/admin/students" "Master Admin: list all registered students with profile and offer summary." "{{adminCookies}}"
  New-Request "Search Students (Master Admin)" "GET" "{{baseUrl}}/api/admin/students?search=student" "Master Admin: search by name, email, phone, or English profile name." "{{adminCookies}}"
  New-Request "Filter Students By Profile Status" "GET" "{{baseUrl}}/api/admin/students?profileStatus=approved" "Valid profileStatus: draft, submitted, under_review, approved, changes_requested, rejected." "{{adminCookies}}"
  New-Request "Filter Students By Passport Status" "GET" "{{baseUrl}}/api/admin/students?passportStatus=valid" "Valid passportStatus: valid, valid_expires_within_year, invalid_lost_never_had_one." "{{adminCookies}}"
  New-Request "Filter Students By Gaza Location" "GET" "{{baseUrl}}/api/admin/students?locationInGaza=gaza_city" "locationInGaza is the student's Gaza location, not the offer/university region." "{{adminCookies}}"
  New-Request "Filter Students By Verified Offer" "GET" "{{baseUrl}}/api/admin/students?hasVerifiedOffer=true" "Master Admin: filter students by verified offer flag." "{{adminCookies}}"
  New-Request "Filter Students By Signed Consent" "GET" "{{baseUrl}}/api/admin/students?consentSigned=true" "Master Admin: filter students by signed consent flag." "{{adminCookies}}"
  New-Request "Combined Student Filters With Pagination" "GET" "{{baseUrl}}/api/admin/students?profileStatus=approved&locationInGaza=gaza_city&hasVerifiedOffer=true&page=1&pageSize=25" "Master Admin: combined filters and pagination." "{{adminCookies}}"
  New-Request "Regional Admin Students" "GET" "{{baseUrl}}/api/admin/students" "Regional Admin: students with at least one offer in the admin's assigned offer/university region." "{{regionalCookies}}"
  New-Request "Regional Admin Students Search" "GET" "{{baseUrl}}/api/admin/students?search=student&page=1&pageSize=25" "Regional Admin: search within students scoped by offer/university region." "{{regionalCookies}}"
  New-Request "Export Students CSV (Master Admin)" "GET" "{{baseUrl}}/api/admin/students/export?profileStatus=approved&locationInGaza=gaza_city" "Master Admin: export filtered students CSV. Use Send and Save Response in Postman if needed." "{{adminCookies}}"
  New-Request "Export Students CSV (Regional Admin)" "GET" "{{baseUrl}}/api/admin/students/export" "Regional Admin: export students CSV scoped to students with offers in assigned offer/university region." "{{regionalCookies}}"
)
Set-Folder "13 Admin Students Grid" $studentGridItems

$volunteerGridItems = @(
  New-Request "List All Volunteers (Master Admin)" "GET" "{{baseUrl}}/api/admin/volunteers" "Master Admin: list all registered volunteers with roles, status, and profile summary." "{{adminCookies}}"
  New-Request "Search Volunteers (Master Admin)" "GET" "{{baseUrl}}/api/admin/volunteers?search=volunteer" "Master Admin: search by name, email, phone, or university affiliation." "{{adminCookies}}"
  New-Request "Filter Volunteers By Status" "GET" "{{baseUrl}}/api/admin/volunteers?volunteerStatus=pending&page=1&pageSize=25" "Valid volunteerStatus: pending, approved, rejected, inactive." "{{adminCookies}}"
  New-Request "Filter Volunteers By Role" "GET" "{{baseUrl}}/api/admin/volunteers?role=mentor" "Filter volunteers/users by role. Common value: mentor." "{{adminCookies}}"
  New-Request "Filter Volunteers By Preferred Region" "GET" "{{baseUrl}}/api/admin/volunteers?preferredRegionId={{regionId}}" "Master Admin: filter by VolunteerProfile.preferredRegionId." "{{adminCookies}}"
  New-Request "Regional Admin Volunteers" "GET" "{{baseUrl}}/api/admin/volunteers" "Regional Admin: volunteers whose preferredRegionId matches the admin's assigned offer/university region." "{{regionalCookies}}"
  New-Request "Export Volunteers CSV (Master Admin)" "GET" "{{baseUrl}}/api/admin/volunteers/export?volunteerStatus=pending" "Master Admin: export filtered volunteers CSV. Use Send and Save Response in Postman if needed." "{{adminCookies}}"
  New-Request "Export Volunteers CSV (Regional Admin)" "GET" "{{baseUrl}}/api/admin/volunteers/export" "Regional Admin: export volunteers CSV scoped to preferred region." "{{regionalCookies}}"
  New-Request "Update Volunteer Assignment (Master Admin)" "PATCH" "{{baseUrl}}/api/admin/volunteers/{{volunteerId}}/assignment" "Master Admin: assign preferred region, approve volunteer, and ensure mentor role is enabled." "{{adminCookies}}" "{`n  `"preferredRegionId`": `"{{regionId}}`",`n  `"volunteerStatus`": `"approved`",`n  `"mentorEnabled`": true`n}"
  New-Request "Update Volunteer Assignment (Regional Admin)" "PATCH" "{{baseUrl}}/api/admin/volunteers/{{volunteerId}}/assignment" "Regional Admin: approve a volunteer already assigned to this admin's region." "{{regionalCookies}}" "{`n  `"volunteerStatus`": `"approved`",`n  `"mentorEnabled`": true`n}"
)
Set-Folder "14 Admin Volunteers Grid" $volunteerGridItems

$adminOfferItems = @(
  New-Request "List Offers (Admin)" "GET" "{{baseUrl}}/api/admin/offers" "Admin offers grid. Response includes offers, summary, and pagination." "{{adminCookies}}"
  New-Request "List Offers With Pagination" "GET" "{{baseUrl}}/api/admin/offers?page=1&pageSize=25" "Admin offers grid with pagination." "{{adminCookies}}"
  New-Request "Filter Offers By Review Status" "GET" "{{baseUrl}}/api/admin/offers?status=under_review" "Valid status: draft, under_review, approved, changes_requested, rejected, removed." "{{adminCookies}}"
  New-Request "Filter Offers By Region" "GET" "{{baseUrl}}/api/admin/offers?regionId={{regionId}}" "Master Admin: filter offers by offer/university region." "{{adminCookies}}"
  New-Request "Filter Offers By Offer Type" "GET" "{{baseUrl}}/api/admin/offers?offerType=Conditional" "Filter by configured offer type text." "{{adminCookies}}"
  New-Request "Filter Offers By University Name" "GET" "{{baseUrl}}/api/admin/offers?universityName=Example%20University" "Filter by university name contains match." "{{adminCookies}}"
  New-Request "Filter Offers By Course Field" "GET" "{{baseUrl}}/api/admin/offers?courseField=Public%20Health" "Filter by course field." "{{adminCookies}}"
  New-Request "Filter Offers By Course Level" "GET" "{{baseUrl}}/api/admin/offers?courseLevel=Masters" "Filter by course level." "{{adminCookies}}"
  New-Request "Filter Offers By Funding Type - Fully Funded" "GET" "{{baseUrl}}/api/admin/offers?fundingType=fully_funded" "Funding type: scholarship covers living costs." "{{adminCookies}}"
  New-Request "Filter Offers By Funding Type - Partial Funding" "GET" "{{baseUrl}}/api/admin/offers?fundingType=partial_funding" "Funding type: scholarship exists but does not cover living costs." "{{adminCookies}}"
  New-Request "Filter Offers By Funding Type - Private Funding" "GET" "{{baseUrl}}/api/admin/offers?fundingType=private_funding" "Funding type: no scholarship, private funding amount > 0." "{{adminCookies}}"
  New-Request "Filter Offers By Funding Type - No Funding" "GET" "{{baseUrl}}/api/admin/offers?fundingType=no_funding" "Funding type: no scholarship and private funding amount is 0." "{{adminCookies}}"
  New-Request "Filter Offers By Scholarship Flag" "GET" "{{baseUrl}}/api/admin/offers?hasScholarship=true" "Filter by scholarship boolean." "{{adminCookies}}"
  New-Request "Search Offers" "GET" "{{baseUrl}}/api/admin/offers?search=public%20health" "Search university, course, field, student name, or student email." "{{adminCookies}}"
  New-Request "Combined Offer Filters" "GET" "{{baseUrl}}/api/admin/offers?status=under_review&offerType=Conditional&fundingType=partial_funding&page=1&pageSize=25" "Combined filters and pagination." "{{adminCookies}}"
  New-Request "Regional Admin Offers" "GET" "{{baseUrl}}/api/admin/offers" "Regional Admin: offers scoped to assigned offer/university region." "{{regionalCookies}}"
  New-Request "Regional Admin Offers By Status" "GET" "{{baseUrl}}/api/admin/offers?status=under_review" "Regional Admin: filtered offers inside assigned region." "{{regionalCookies}}"
  New-Request "Export Offers CSV (Master Admin)" "GET" "{{baseUrl}}/api/admin/offers/export?fundingType=partial_funding&hasScholarship=true" "Master Admin: export filtered offers CSV. Use Send and Save Response in Postman if needed." "{{adminCookies}}"
  New-Request "Export Offers CSV (Regional Admin)" "GET" "{{baseUrl}}/api/admin/offers/export?status=under_review" "Regional Admin: export offers CSV scoped to assigned offer/university region." "{{regionalCookies}}"
  New-Request "Get Offer (Admin)" "GET" "{{baseUrl}}/api/admin/offers/{{offerId}}" "Admin: get one offer by ID. Master Admin all; Regional Admin only assigned region." "{{adminCookies}}"
  New-Request "Get Offer Revisions (Admin)" "GET" "{{baseUrl}}/api/admin/offers/{{offerId}}/revisions" "Admin: get changed fields and before/after values for approved-offer edits." "{{adminCookies}}"
  New-Request "Review Offer - Approve" "PATCH" "{{baseUrl}}/api/admin/offers/{{offerId}}/review" "Admin: approve an under-review offer." "{{adminCookies}}" "{`n  `"status`": `"approved`",`n  `"notes`": `"Offer verified.`"`n}"
  New-Request "Review Offer - Request Changes" "PATCH" "{{baseUrl}}/api/admin/offers/{{offerId}}/review" "Admin: request changes for an under-review offer." "{{adminCookies}}" "{`n  `"status`": `"changes_requested`",`n  `"notes`": `"Please upload a clearer offer letter.`"`n}"
  New-Request "Review Offer - Reject" "PATCH" "{{baseUrl}}/api/admin/offers/{{offerId}}/review" "Admin: reject an under-review offer." "{{adminCookies}}" "{`n  `"status`": `"rejected`",`n  `"notes`": `"Rejected after review.`"`n}"
)
Set-Folder "07 Admin Offer Review" $adminOfferItems

$studentQueryItems = @(
  New-Request "Create General Query" "POST" "{{baseUrl}}/api/queries" "Student: create a general support query. Current API uses queryType/title/message." "{{studentCookies}}" "{`n  `"queryType`": `"general_issue`",`n  `"title`": `"Question about my application`",`n  `"message`": `"I need help understanding the next steps.`"`n}"
  New-Request "Create Visa/Offer Query" "POST" "{{baseUrl}}/api/queries" "Student: create a query linked to an offer region and offer. Use regionId from regions and offerId from created offer." "{{studentCookies}}" "{`n  `"queryType`": `"visa_offer_issue`",`n  `"title`": `"Visa issue for my offer`",`n  `"message`": `"I have a problem with my visa documents.`",`n  `"regionId`": `"{{regionId}}`",`n  `"offerId`": `"{{offerId}}`"`n}"
  New-Request "List My Queries" "GET" "{{baseUrl}}/api/queries/my" "Student: list only their own queries." "{{studentCookies}}"
  New-Request "Get My Query" "GET" "{{baseUrl}}/api/queries/{{queryId}}" "Student: get one of their own queries." "{{studentCookies}}"
  New-Request "Add Query Message" "POST" "{{baseUrl}}/api/queries/{{queryId}}/messages" "Student: add a chronological reply under their own query." "{{studentCookies}}" "{`n  `"message`": `"Here is my follow-up message.`"`n}"
)
Set-Folder "08 Queries / Ticketing" $studentQueryItems

$adminQueryItems = @(
  New-Request "List Queries (Admin)" "GET" "{{baseUrl}}/api/admin/queries" "Master Admin: all queries. Regional Admin: only matching assigned offer/university region." "{{adminCookies}}"
  New-Request "List Open Queries (Admin)" "GET" "{{baseUrl}}/api/admin/queries?status=open" "Admin: filter by query status. Valid values: open, assigned, resolved." "{{adminCookies}}"
  New-Request "List Queries By Type (Admin)" "GET" "{{baseUrl}}/api/admin/queries?queryType=visa_offer_issue" "Admin: filter by configurable query type." "{{adminCookies}}"
  New-Request "List Queries By Region (Admin)" "GET" "{{baseUrl}}/api/admin/queries?regionId={{regionId}}" "Admin: filter by offer/university region." "{{adminCookies}}"
  New-Request "Get Query (Admin)" "GET" "{{baseUrl}}/api/admin/queries/{{queryId}}" "Admin: view one query with messages." "{{adminCookies}}"
  New-Request "Assign Query To Mentor" "PATCH" "{{baseUrl}}/api/admin/queries/{{queryId}}/assign" "Admin: assign query to an active mentor/volunteer user." "{{adminCookies}}" "{`n  `"assignedToUserId`": `"{{mentorId}}`"`n}"
  New-Request "Add Query Message (Admin)" "POST" "{{baseUrl}}/api/admin/queries/{{queryId}}/messages" "Admin: add a reply under the query." "{{adminCookies}}" "{`n  `"message`": `"We are reviewing this and assigning a mentor.`"`n}"
  New-Request "Resolve Query (Admin)" "PATCH" "{{baseUrl}}/api/admin/queries/{{queryId}}/resolve" "Admin: resolve a query." "{{adminCookies}}" "{`n  `"resolution`": `"Issue has been resolved.`"`n}"
)
Set-Folder "09 Admin Queries" $adminQueryItems

$mentorQueryItems = @(
  New-Request "List Assigned Queries (Mentor)" "GET" "{{baseUrl}}/api/mentor/queries" "Mentor: list only queries assigned to them." "{{volunteerCookies}}"
  New-Request "Get Assigned Query (Mentor)" "GET" "{{baseUrl}}/api/mentor/queries/{{queryId}}" "Mentor: view an assigned query." "{{volunteerCookies}}"
  New-Request "Accept Assigned Query (Mentor)" "PATCH" "{{baseUrl}}/api/mentor/queries/{{queryId}}/accept" "Mentor: accept an assigned query before working on it." "{{volunteerCookies}}"
  New-Request "Add Query Message (Mentor)" "POST" "{{baseUrl}}/api/mentor/queries/{{queryId}}/messages" "Mentor: reply to an assigned query." "{{volunteerCookies}}" "{`n  `"message`": `"Mentor response to the query.`"`n}"
  New-Request "Resolve Query (Mentor)" "PATCH" "{{baseUrl}}/api/mentor/queries/{{queryId}}/resolve" "Mentor: resolve an assigned query." "{{volunteerCookies}}" "{`n  `"resolution`": `"Mentor has resolved the issue.`"`n}"
)
Set-Folder "10 Mentor Queries" $mentorQueryItems

$adminAuditLogItems = @(
  New-Request "List Audit Logs" "GET" "{{baseUrl}}/api/admin/audit-logs" "Master Admin: list paginated audit logs." "{{adminCookies}}"
  New-Request "Filter Audit Logs By Action" "GET" "{{baseUrl}}/api/admin/audit-logs?action=offers_exported&page=1&pageSize=25" "Master Admin: filter audit logs by action." "{{adminCookies}}"
  New-Request "Filter Audit Logs By Document Downloads" "GET" "{{baseUrl}}/api/admin/audit-logs?action=document_downloaded&page=1&pageSize=25" "Master Admin: review protected document download audit events." "{{adminCookies}}"
  New-Request "Filter Audit Logs By Entity Type" "GET" "{{baseUrl}}/api/admin/audit-logs?entityType=offer" "Master Admin: filter audit logs by entity type." "{{adminCookies}}"
  New-Request "Filter Audit Logs By Actor" "GET" "{{baseUrl}}/api/admin/audit-logs?actorUserId={{adminUserId}}" "Master Admin: filter audit logs by actor user id." "{{adminCookies}}"
  New-Request "Filter Audit Logs By Date Range" "GET" "{{baseUrl}}/api/admin/audit-logs?from=2026-05-01&to=2026-05-18" "Master Admin: filter audit logs by created date range." "{{adminCookies}}"
  New-Request "Get Audit Log" "GET" "{{baseUrl}}/api/admin/audit-logs/{{auditLogId}}" "Master Admin: get one audit log by id." "{{adminCookies}}"
)
Set-Folder "15 Admin Audit Logs" $adminAuditLogItems

$adminAnnouncements = $collection.item | Where-Object { $_.name -eq "12 Admin Announcements" } | Select-Object -First 1
if ($adminAnnouncements) {
  foreach ($item in $adminAnnouncements.item) {
    if ($item.name -eq "Publish Announcement") {
      $item.request.url = New-Url "{{baseUrl}}/api/admin/announcements/{{announcementId}}"
      $item.request.description = "Publishes an announcement by setting isPublished=true."
    }
    if ($item.name -eq "Unpublish Announcement") {
      $item.request.url = New-Url "{{baseUrl}}/api/admin/announcements/{{announcementId}}"
      $item.request.description = "Unpublishes an announcement by setting isPublished=false."
    }
  }
}

$negativeFolder = $collection.item | Where-Object { $_.name -eq "99 Negative / Security Tests" } | Select-Object -First 1
if ($negativeFolder) {
  $existingNames = @($negativeFolder.item | ForEach-Object { $_.name })
  $newNegativeItems = @(
    New-Request "Admin Offers - Invalid Funding Type Should Fail" "GET" "{{baseUrl}}/api/admin/offers?fundingType=wrong_type" "Should fail validation." "{{adminCookies}}"
    New-Request "Admin Offers - Regional Admin Other Region Should Fail" "GET" "{{baseUrl}}/api/admin/offers?regionId={{otherRegionId}}" "Regional Admin cannot request another region's offers." "{{regionalCookies}}"
    New-Request "Admin Offers Export - Student Role Should Fail" "GET" "{{baseUrl}}/api/admin/offers/export" "Student should not export admin offers." "{{studentCookies}}"
    New-Request "Admin Volunteers - Student Role Should Fail" "GET" "{{baseUrl}}/api/admin/volunteers" "Student should not access admin volunteers grid." "{{studentCookies}}"
    New-Request "Admin Students Export - Unauthenticated Should Fail" "GET" "{{baseUrl}}/api/admin/students/export" "Unauthenticated user should not export students." $null
    New-Request "Admin Volunteers - Invalid Status Should Fail" "GET" "{{baseUrl}}/api/admin/volunteers?volunteerStatus=not_a_status" "Should fail validation." "{{adminCookies}}"
    New-Request "Admin Volunteers Export - Student Role Should Fail" "GET" "{{baseUrl}}/api/admin/volunteers/export" "Student should not export volunteers." "{{studentCookies}}"
    New-Request "Volunteer Assignment - Student Role Should Fail" "PATCH" "{{baseUrl}}/api/admin/volunteers/{{volunteerId}}/assignment" "Student should not update volunteer assignment." "{{studentCookies}}" "{`n  `"volunteerStatus`": `"approved`"`n}"
    New-Request "Volunteer Assignment - Regional Admin Other Region Should Fail" "PATCH" "{{baseUrl}}/api/admin/volunteers/{{volunteerId}}/assignment" "Regional Admin cannot assign volunteer to another region." "{{regionalCookies}}" "{`n  `"preferredRegionId`": `"{{otherRegionId}}`",`n  `"volunteerStatus`": `"approved`"`n}"
    New-Request "Audit Logs - Regional Admin Should Fail" "GET" "{{baseUrl}}/api/admin/audit-logs" "Regional Admin should not access audit logs in MVP." "{{regionalCookies}}"
    New-Request "Audit Logs - Student Role Should Fail" "GET" "{{baseUrl}}/api/admin/audit-logs" "Student should not access audit logs." "{{studentCookies}}"
    New-Request "Audit Logs - Invalid Date Range Should Fail" "GET" "{{baseUrl}}/api/admin/audit-logs?from=2026-05-18&to=2026-05-01" "Should fail validation because from is after to." "{{adminCookies}}"
    New-Request "Student Dashboard - Admin Role Should Fail" "GET" "{{baseUrl}}/api/student/dashboard" "Admin should not access student dashboard." "{{adminCookies}}"
    New-Request "Admin Dashboard - Student Role Should Fail" "GET" "{{baseUrl}}/api/admin/dashboard" "Student should not access admin dashboard." "{{studentCookies}}"
    New-Request "Mentor Dashboard - Student Role Should Fail" "GET" "{{baseUrl}}/api/mentor/dashboard" "Student should not access mentor dashboard." "{{studentCookies}}"
    New-Request "Reset Password - Invalid Token Should Fail" "POST" "{{baseUrl}}/api/auth/reset-password" "Invalid reset token should fail." $null "{`n  `"token`": `"invalid-token-value-that-is-long-enough`",`n  `"password`": `"NewPassword123!`"`n}"
    New-Request "Verify Email - Invalid Token Should Fail" "POST" "{{baseUrl}}/api/auth/verify-email" "Invalid verification token should fail." $null "{`n  `"token`": `"invalid-token-value-that-is-long-enough`"`n}"
    New-Request "Mentor Accept Unassigned Query Should Fail" "PATCH" "{{baseUrl}}/api/mentor/queries/{{queryId}}/accept" "Mentor should not accept a query unless it is assigned to them." "{{volunteerCookies}}"
  )
  foreach ($item in $newNegativeItems) {
    if ($existingNames -notcontains $item.name) {
      $negativeFolder.item += $item
    }
  }

  foreach ($item in $negativeFolder.item) {
    if ($item.name -eq "Create Query - Missing Region For Visa Issue") {
      $item.request.body.raw = "{`n  `"queryType`": `"visa_offer_issue`",`n  `"title`": `"Visa issue`",`n  `"message`": `"Missing regionId should cause validation error.`"`n}"
      $item.request.description = "Should fail when a query category requires regionId."
    }
    if ($item.name -eq "Mentor Access Unassigned Query") {
      $item.request.url = New-Url "{{baseUrl}}/api/mentor/queries/{{queryId}}"
      $item.request.description = "Should fail with 403 because mentor can only access queries assigned to them."
    }
  }
}

$desiredVariables = @(
  @{ key = "baseUrl"; value = "http://localhost:4000"; description = "Base URL for local API testing." }
  @{ key = "adminCookies"; value = ""; description = "Optional manual Cookie header value for admin session. Postman cookie jar also works." }
  @{ key = "studentCookies"; value = ""; description = "Optional manual Cookie header value for student session. Postman cookie jar also works." }
  @{ key = "regionalCookies"; value = ""; description = "Optional manual Cookie header value for regional admin session. Postman cookie jar also works." }
  @{ key = "volunteerCookies"; value = ""; description = "Optional manual Cookie header value for volunteer/mentor session. Postman cookie jar also works." }
  @{ key = "regionId"; value = ""; description = "Region UUID from GET /api/config/regions." }
  @{ key = "otherRegionId"; value = ""; description = "Region UUID different from the seeded regional admin region." }
  @{ key = "adminUserId"; value = ""; description = "Admin user UUID for audit log actor filters." }
  @{ key = "offerId"; value = ""; description = "Offer UUID." }
  @{ key = "volunteerId"; value = ""; description = "Volunteer user UUID from GET /api/admin/volunteers." }
  @{ key = "queryId"; value = ""; description = "Query UUID from POST /api/queries or admin query list." }
  @{ key = "auditLogId"; value = ""; description = "Audit log UUID from GET /api/admin/audit-logs." }
  @{ key = "resetToken"; value = ""; description = "Password reset token copied from email link." }
  @{ key = "verificationToken"; value = ""; description = "Email verification token copied from email link." }
  @{ key = "mentorId"; value = ""; description = "Active mentor/volunteer user UUID used when assigning a query." }
  @{ key = "announcementId"; value = ""; description = "Announcement UUID." }
  @{ key = "draftAnnouncementId"; value = ""; description = "Draft announcement UUID for negative public access tests." }
)

$variables = @()
foreach ($desired in $desiredVariables) {
  $existing = @($collection.variable) | Where-Object { $_.key -eq $desired.key } | Select-Object -First 1
  if ($existing) {
    if (-not $existing.value -and $desired.value) {
      $existing.value = $desired.value
    }
    if ($desired.description) {
      $existing.description = $desired.description
    }
    $variables += $existing
  } else {
    $variables += [ordered]@{
      key         = $desired.key
      value       = $desired.value
      description = $desired.description
    }
  }
}
$collection.variable = @($variables)

$folderOrder = @(
  "00 Health",
  "01 Auth",
  "02 Config / Master Data",
  "03 Documents",
  "04 Student Profile",
  "05 Student Offers",
  "06 Admin Student Profile Review",
  "07 Admin Offer Review",
  "08 Queries / Ticketing",
  "09 Admin Queries",
  "10 Mentor Queries",
  "11 Announcements",
  "12 Admin Announcements",
  "13 Admin Students Grid",
  "14 Admin Volunteers Grid",
  "15 Admin Audit Logs",
  "16 Dashboards",
  "99 Negative / Security Tests"
)

$orderedItems = @()
foreach ($folderName in $folderOrder) {
  $match = $collection.item | Where-Object { $_.name -eq $folderName } | Select-Object -First 1
  if ($match) {
    $orderedItems += $match
  }
}

$remainingItems = @($collection.item | Where-Object { $folderOrder -notcontains $_.name })
$collection.item = @($orderedItems + $remainingItems)

$json = $collection | ConvertTo-Json -Depth 100
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $collectionPath), $json, $utf8NoBom)
