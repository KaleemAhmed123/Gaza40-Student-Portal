import { asyncHandler, sendSuccess } from "../../shared/http";
import { getMentorStudentDetails } from "./offer.service";

export const getMentorStudentDetailsHandler = asyncHandler(async (req, res) => {
  const result = await getMentorStudentDetails(req.authUser!.id, req.params.id);
  sendSuccess(res, result);
});
