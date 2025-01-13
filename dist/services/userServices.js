"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("../models/userModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const http_errors_1 = __importDefault(require("http-errors"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const linkStripeAccount = async (req, res, next) => {
    const userId = req.user.userId;
    let error, user;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: "https://example.com/cancel",
        return_url: `https://example.com/success?accountId=${user.stripeAccountId}`,
        type: "account_onboarding",
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: { accountLink: accountLink.url } });
};
const getMyTickets = async (req, res, next) => {
    const userId = req.user.userId;
    const [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: user.tickets });
};
const getMyGuests = async (req, res, next) => {
    const userId = req.user.userId;
    const [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: user.guests });
};
const getMySchedules = async (req, res, next) => {
    const userId = req.user.userId;
    const [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: user.schedule });
};
const updateSchedule = async (req, res, next) => {
    const userId = req.user.userId;
    const schedules = req.body.schedules;
    let error, user;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Account not found"));
    user.schedule = schedules;
    [error] = await (0, await_to_ts_1.default)(user.save());
    if (error)
        return next(error);
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: user });
};
const getMyReviews = async (req, res, next) => {
    const userId = req.body.userId || req.user.userId;
    const [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Account not found"));
    if (user.reviews?.length === 0) {
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ success: true, message: "Success", data: { totalReviews: 0, avgRating: 0 } });
    }
    const totalReviews = user.reviews.length;
    const avgRating = user.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    return res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ success: true, message: "Success", data: { totalReviews, avgRating, reviews: user.reviews } });
};
const UserServices = {
    linkStripeAccount,
    updateSchedule,
    getMyTickets,
    getMyGuests,
    getMySchedules,
    getMyReviews,
};
exports.default = UserServices;
