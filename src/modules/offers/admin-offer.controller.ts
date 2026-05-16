import { asyncHandler, sendSuccess } from "../../shared/http";
import { getAdminOffer, listAdminOffers, reviewOffer } from "./offer.service";
import { listAdminOffersQuerySchema, reviewOfferSchema } from "./offer.validation";

export const listAdminOffersHandler = asyncHandler(async (req, res) => {
  const query = listAdminOffersQuerySchema.parse(req.query);
  const offers = await listAdminOffers(req.authUser!.id, query);
  sendSuccess(res, { offers });
});

export const getAdminOfferHandler = asyncHandler(async (req, res) => {
  const offer = await getAdminOffer(req.authUser!.id, req.params.id);
  sendSuccess(res, { offer });
});

export const reviewOfferHandler = asyncHandler(async (req, res) => {
  const input = reviewOfferSchema.parse(req.body);
  const offer = await reviewOffer({
    userId: req.authUser!.id,
    offerId: req.params.id,
    data: input,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  sendSuccess(res, { offer });
});
