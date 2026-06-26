import { env } from "../config/env";

export const TEMPLATE_COLORS = {
  primary: "#115e59", // teal-800
  secondary: "#0d9488", // teal-500
  text: "#1f2937",
  textLight: "#4b5563",
  background: "#f3f4f6",
  white: "#ffffff",
  border: "#e5e7eb"
};

// Base Layout for all emails
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: ${TEMPLATE_COLORS.text};
      background-color: ${TEMPLATE_COLORS.background};
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: ${TEMPLATE_COLORS.primary};
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      color: ${TEMPLATE_COLORS.white};
      margin: 0;
      font-size: 24px;
    }
    .content {
      background-color: ${TEMPLATE_COLORS.white};
      padding: 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: ${TEMPLATE_COLORS.textLight};
      font-size: 12px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${TEMPLATE_COLORS.primary};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .data-table td {
      padding: 10px;
      border-bottom: 1px solid ${TEMPLATE_COLORS.border};
    }
    .data-table td:first-child {
      font-weight: bold;
      color: ${TEMPLATE_COLORS.textLight};
      width: 120px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${env.FRONTEND_URL}/LOGO.png" alt="Gaza40 Logo" style="max-height: 60px; display: block; margin: 0 auto;" />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Gaza40. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  // Welcome Email for Students and Mentors
  welcome: (name: string, role: 'student' | 'mentor') => {
    const roleText = role === 'student' ? 'Student' : 'Volunteer';
    const content = `
      <h2>Welcome to Gaza40!</h2>
      <p>Hello ${name},</p>
      <p>Your ${roleText} account has been successfully created. We are thrilled to have you join the Gaza40 community.</p>
      <p>You can now log in to the portal using your email and password to start exploring all the features available to you.</p>
      <center>
        <a href="${env.FRONTEND_URL}/login" class="btn">Log In Now</a>
      </center>
      <p>If you have any questions, please reach out to our support team.</p>
      <p>Best regards,<br/>The Gaza40 Team</p>
    `;
    return baseTemplate(content, "Welcome to Gaza40");
  },

  // Password Reset Email
  forgotPassword: (name: string, resetUrl: string) => {
    const content = `
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your Gaza40 account.</p>
      <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
      <center>
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </center>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;
    return baseTemplate(content, "Password Reset - Gaza40");
  },

  // Generic Notification (Group Assignment, Queries, Offers)
  notification: (name: string, title: string, message: string, actionUrl?: string, actionText?: string) => {
    let actionHtml = '';
    if (actionUrl && actionText) {
      actionHtml = `
        <center>
          <a href="${actionUrl}" class="btn">${actionText}</a>
        </center>
      `;
    }

    const content = `
      <h2>${title}</h2>
      <p>Hello ${name},</p>
      <p>${message}</p>
      ${actionHtml}
    `;
    return baseTemplate(content, title);
  },

  // Admin Notification (New Volunteer)
  adminNewVolunteer: (volunteerName: string, volunteerEmail: string) => {
    const content = `
      <h2>New Volunteer Signup</h2>
      <p>Hello Admin,</p>
      <p>A new volunteer has signed up on the Gaza40 platform.</p>
      <table class="data-table">
        <tr>
          <td>Name:</td>
          <td>${volunteerName}</td>
        </tr>
        <tr>
          <td>Email:</td>
          <td>${volunteerEmail}</td>
        </tr>
      </table>
      <center>
        <a href="${env.FRONTEND_URL}/admin/volunteers" class="btn">View Volunteers</a>
      </center>
    `;
    return baseTemplate(content, "New Volunteer Signup - Gaza40");
  },

  // Regional Admin Invite
  regionalAdminInvite: (name: string, email: string, temporaryPassword?: string, regionName?: string) => {
    let passwordHtml = '';
    
    if (temporaryPassword) {
      passwordHtml = `
        <tr>
          <td>Password:</td>
          <td><code>${temporaryPassword}</code></td>
        </tr>
      `;
    }

    let regionHtml = '';
    if (regionName) {
      regionHtml = `
        <tr>
          <td>Region:</td>
          <td>${regionName}</td>
        </tr>
      `;
    }

    const content = `
      <h2>Regional Admin Account Created</h2>
      <p>Hello ${name},</p>
      <p>An administrator has created a Regional Admin account for you on the Gaza40 platform.</p>
      <table class="data-table">
        <tr>
          <td>Email:</td>
          <td>${email}</td>
        </tr>
        ${regionHtml}
        ${passwordHtml}
      </table>
      <p>Please log in using the button below. ${temporaryPassword ? '<strong>We strongly recommend changing your password immediately after logging in.</strong>' : ''}</p>
      <center>
        <a href="${env.FRONTEND_URL}/login" class="btn">Log In to Dashboard</a>
      </center>
    `;
    return baseTemplate(content, "Regional Admin Invite - Gaza40");
  }
};
