"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("../models/userModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const enum_1 = require("../shared/enum");
const hire = async (req, res, next) => {
    const userId = req.user.userId;
    const { date, schedule, map, users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Users array is required and cannot be empty"));
    }
    try {
        const user = await userModel_1.default.findById(userId);
        if (!user)
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
        const targetUsers = await userModel_1.default.find({ _id: { $in: users } });
        if (targetUsers.length !== users.length) {
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "One or more users not found"));
        }
        for (const targetUser of targetUsers) {
            user.requests = user.requests || [];
            const sentRequest = {
                types: enum_1.RequestType.SENT,
                status: enum_1.RequestStatus.PENDING,
                date,
                schedule,
                map,
                user: targetUser._id,
                name: targetUser.name,
                avatar: targetUser.avatar,
                rating: targetUser.averageRating,
            };
            user.requests.push(sentRequest);
            targetUser.requests = targetUser.requests || [];
            const receivedRequest = {
                types: enum_1.RequestType.RECIEVED,
                status: enum_1.RequestStatus.PENDING,
                date,
                schedule,
                map,
                user: user._id,
                name: user.name,
                avatar: user.avatar,
                rating: user.averageRating,
            };
            targetUser.requests.push(receivedRequest);
        }
        await user.save();
        await Promise.all(targetUsers.map((targetUser) => targetUser.save()));
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Requests sent successfully" });
    }
    catch (error) {
        next(error);
    }
};
