import { RoleCode, AccountStatus } from "../db/models/enums";
import { userRepository } from "../db/repositories";
import { sendEmailBestEffort } from "./email";

export async function notifyMasterAdminsOfProfileSubmission(input: {
  studentName: string;
  studentEmail: string;
}) {
  const admins = await userRepository.find({
    accountStatus: AccountStatus.active,
    roles: RoleCode.master_admin
  });

  if (admins.length > 0) {
    sendEmailBestEffort({
      to: admins.map((admin) => admin.email),
      subject: "Gaza40+ profile submitted for review",
      text: `${input.studentName} (${input.studentEmail}) submitted their profile for review.`
    });
  }
}

export async function notifyAdminsOfOfferReview(input: {
  studentName: string;
  studentEmail: string;
  offerId: string;
  regionId: string;
  universityName: string;
  courseName: string;
  reason: "submitted" | "edited_after_approval";
}) {
  // We need to find users who have the role 'regional_admin' and have a regional admin profile active for this regionId.
  // In Mongoose, we can populate or do an aggregation, or simply find the regional admin profiles first and then the users.
  // Finding the regional admin profiles for this region is very clean:
  const { RegionalAdminProfileModel } = require("../db/models/regional-admin-profile.model");
  const activeProfiles = await RegionalAdminProfileModel.find({
    regionId: input.regionId,
    status: "active",
    deletedAt: null
  }).exec();

  const userIds = activeProfiles.map((p: any) => p.userId);

  let recipients: string[] = [];

  if (userIds.length > 0) {
    const regionalAdmins = await userRepository.find({
      _id: { $in: userIds },
      accountStatus: AccountStatus.active,
      roles: RoleCode.regional_admin
    });
    recipients = regionalAdmins.map((admin) => admin.email);
  }

  if (recipients.length === 0) {
    const masterAdmins = await userRepository.find({
      accountStatus: AccountStatus.active,
      roles: RoleCode.master_admin
    });
    recipients = masterAdmins.map((admin) => admin.email);
  }

  const actionText =
    input.reason === "edited_after_approval" ? "edited an approved offer" : "submitted an offer";

  if (recipients.length > 0) {
    sendEmailBestEffort({
      to: recipients,
      subject: "Gaza40+ offer needs review",
      text: `${input.studentName} (${input.studentEmail}) ${actionText} for ${input.universityName} - ${input.courseName}.\n\nOffer ID: ${input.offerId}`
    });
  }
}
