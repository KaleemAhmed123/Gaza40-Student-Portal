import { asyncHandler, sendSuccess } from "../../shared/http";
import {
  addMentorMessage,
  acceptMentorQuery,
  getMentorQuery,
  listMentorQueries,
  resolveMentorQuery
} from "./query.service";
import { addQueryMessageSchema } from "./query.validation";

export const listMentorQueriesHandler = asyncHandler(async (req, res) => {
  const queries = await listMentorQueries(req.authUser!.id);
  sendSuccess(res, { queries });
});

export const getMentorQueryHandler = asyncHandler(async (req, res) => {
  const query = await getMentorQuery(req.authUser!.id, req.params.id);
  sendSuccess(res, { query });
});

export const acceptMentorQueryHandler = asyncHandler(async (req, res) => {
  const query = await acceptMentorQuery({
    userId: req.authUser!.id,
    queryId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { query });
});

export const addMentorQueryMessageHandler = asyncHandler(async (req, res) => {
  const input = addQueryMessageSchema.parse(req.body);
  const message = await addMentorMessage({
    userId: req.authUser!.id,
    queryId: req.params.id,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { message }, 201);
});

export const resolveMentorQueryHandler = asyncHandler(async (req, res) => {
  const query = await resolveMentorQuery({
    userId: req.authUser!.id,
    queryId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { query });
});
