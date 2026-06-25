import express from "express";
import { 
    loginWholesaleSeller, 
    registerWholesaleSeller,
    forgotPasswordSeller,
    resetPasswordSeller,
} from "../controllers/wholesale-sellerController.js";

const wholesaleSellerRouter = express.Router();

wholesaleSellerRouter.post("/register", registerWholesaleSeller);
wholesaleSellerRouter.post("/login", loginWholesaleSeller);
wholesaleSellerRouter.post("/forgot-password", forgotPasswordSeller);
wholesaleSellerRouter.post("/reset-password", resetPasswordSeller);

export default wholesaleSellerRouter;
