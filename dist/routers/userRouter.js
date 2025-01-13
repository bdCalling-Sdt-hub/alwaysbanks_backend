"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = __importDefault(require("../controllers/userController"));
const authorization_1 = require("../middlewares/authorization");
const userServices_1 = __importDefault(require("../services/userServices"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const fileHandler_1 = __importDefault(require("../middlewares/fileHandler"));
const router = express_1.default.Router();
router.post("/link-account", authorization_1.authorize, userServices_1.default.linkStripeAccount);
router.put("/update-schedule", authorization_1.authorize, userServices_1.default.updateSchedule);
router.get("/my-schedule", authorization_1.authorize, userServices_1.default.getMySchedules);
router.get("/my-tickets", authorization_1.authorize, userServices_1.default.getMyTickets);
router.get("/my-guests", authorization_1.authorize, userServices_1.default.getMyGuests);
router.get("/my-reviews", authorization_1.authorize, userServices_1.default.getMyReviews);
router.post("/approve/:id", authorization_1.authorize, authorization_1.isAdmin, userController_1.default.approve);
router.post("/block/:id", authorization_1.authorize, authorization_1.isAdmin, userController_1.default.block);
router.post("/unblock/:id", authorization_1.authorize, authorization_1.isAdmin, userController_1.default.unblock);
router.get("/all", authorization_1.authorize, userController_1.default.getAllUsers);
router.get("/info", authorization_1.authorize, userController_1.default.get);
router.put("/update", (0, express_fileupload_1.default)(), fileHandler_1.default, authorization_1.authorize, userController_1.default.update);
exports.default = router;
