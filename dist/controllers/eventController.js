"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const eventModel_1 = __importDefault(require("../models/eventModel"));
const stripe_1 = __importDefault(require("stripe"));
const http_errors_1 = __importDefault(require("http-errors"));
const subCategoryModel_1 = __importDefault(require("../models/subCategoryModel"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const create = async (req, res, next) => {
    const userId = req.user.userId;
    const { title, organizer, categoryId, subCategoryId, date, description, coverUrl, galleryUrls, deadline, location, latitude, longitude, } = req.body;
    const ticketPrice = parseInt(req.body.ticketPrice);
    const availableTickets = parseInt(req.body.availableTickets);
    let error, product, price, event, subCategory;
    [error, product] = await (0, await_to_ts_1.default)(stripe.products.create({
        name: title,
        description: description,
    }));
    if (error)
        return next(error);
    [error, price] = await (0, await_to_ts_1.default)(stripe.prices.create({
        product: product.id,
        unit_amount: ticketPrice,
        currency: "usd",
    }));
    if (error)
        return next(error);
    [error, subCategory] = await (0, await_to_ts_1.default)(subCategoryModel_1.default.findById(subCategoryId));
    if (error)
        return next(error);
    if (!subCategory)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Subcategory not found"));
    [error, event] = await (0, await_to_ts_1.default)(eventModel_1.default.create({
        title,
        organizer,
        host: userId,
        category: categoryId,
        subCategory: subCategoryId,
        date,
        description,
        cover: coverUrl,
        gallery: galleryUrls,
        ticketPrice,
        productId: product.id,
        ticketPriceId: price.id,
        deadline,
        availableTickets,
        map: {
            location,
            latitude: Number.parseInt(latitude),
            longitude: Number.parseInt(longitude),
        },
    }));
    if (error)
        return next(error);
    subCategory.events.push(event._id);
    [error] = await (0, await_to_ts_1.default)(subCategory.save());
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, message: "Success", data: event });
};
const get = async (req, res, next) => {
    const id = req.params.id;
    const [error, event] = await (0, await_to_ts_1.default)(eventModel_1.default.findById(id)
        .populate({ path: "host", select: "name" })
        .populate({ path: "category", select: "title" })
        .populate({ path: "subCategory", select: "title" })
        .lean());
    if (error)
        return next(error);
    if (!event)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Event Not Found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: event });
};
const getAll = async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const [error, events] = await (0, await_to_ts_1.default)(eventModel_1.default.find()
        .populate({ path: "host", select: "name" })
        .populate({ path: "category", select: "title" })
        .populate({ path: "subCategory", select: "title" })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean());
    if (error)
        return next(error);
    if (!events)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Event Not Found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: events });
};
const update = async (req, res, next) => {
    const id = req.params.id;
    const { title, organizer, description, coverUrl, galleryUrls, availableTickets, deadline } = req.body;
    let error, event;
    [error, event] = await (0, await_to_ts_1.default)(eventModel_1.default.findById(id));
    if (error)
        return next(error);
    if (!event)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Event Not Found"));
    console.log(event);
    if (title || description) {
        event.title = title || event.title;
        event.description = description || event.description;
        [error] = await (0, await_to_ts_1.default)(stripe.products.update(event.productId, { name: title, description: description }));
        if (error)
            return next(error);
    }
    event.organizer = organizer || event.organizer;
    event.deadline = deadline || event.deadline;
    event.availableTickets = availableTickets || event.availableTickets;
    if (coverUrl) {
        // await Cloudinary.remove(coverUrl);
        event.cover = coverUrl;
    }
    if (galleryUrls) {
        // await Cloudinary.remove(galleryUrls);
        event.gallery = galleryUrls;
    }
    [error, event] = await (0, await_to_ts_1.default)(event.save());
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: event });
};
const remove = async (req, res, next) => {
    const id = req.params.id;
    const [error, event] = await (0, await_to_ts_1.default)(eventModel_1.default.findByIdAndDelete(id));
    if (error)
        return next(error);
    if (!event)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Event Not Found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: {} });
};
const EventController = {
    create,
    get,
    getAll,
    update,
    remove,
};
exports.default = EventController;
