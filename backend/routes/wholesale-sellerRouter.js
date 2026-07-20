import express from "express";
import { 
    loginWholesaleSeller, 
    registerWholesaleSeller,
    forgotPasswordSeller,
    resetPasswordSeller,
    getSellerDetails,
    editSellerProfile,
} from "../controllers/wholesale-sellerController.js";

const wholesaleSellerRouter = express.Router();

wholesaleSellerRouter.post("/register", registerWholesaleSeller);
wholesaleSellerRouter.post("/login", loginWholesaleSeller);
wholesaleSellerRouter.post("/forgot-password", forgotPasswordSeller);
wholesaleSellerRouter.post("/reset-password", resetPasswordSeller);
wholesaleSellerRouter.get("/details", getSellerDetails);
wholesaleSellerRouter.put("/edit-profile", editSellerProfile);

export default wholesaleSellerRouter;
