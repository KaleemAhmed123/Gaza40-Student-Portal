import { asyncHandler, sendSuccess } from "../../shared/http";
import {
  addStudentMessage,
  createQuery,
  getMyQuery,
  listMyQueries
} from "./query.service";
import { addQueryMessageSchema, createQuerySchema } from "./query.validation";

export const createQueryHandler = asyncHandler(async (req, res) => {
  const input = createQuerySchema.parse(req.body);
  const query = await createQuery({
    userId: req.authUser!.id,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { query }, 201);
});

export const listMyQueriesHandler = asyncHandler(async (req, res) => {
  const queries = await listMyQueries(req.authUser!.id);
  sendSuccess(res, { queries });
});

export const getMyQueryHandler = asyncHandler(async (req, res) => {
  const query = await getMyQuery(req.authUser!.id, req.params.id);
  sendSuccess(res, { query });
});

export const addStudentQueryMessageHandler = asyncHandler(async (req, res) => {
  const input = addQueryMessageSchema.parse(req.body);
  const message = await addStudentMessage({
    userId: req.authUser!.id,
    queryId: req.params.id,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { message }, 201);
});
