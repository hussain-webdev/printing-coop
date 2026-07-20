import express from "express";
import { addProduct, getAllProducts, getProductDetails } from "../controllers/productController.js";
import upload from "../middleware/multer.js";

const productRouter = express.Router();

// Routes
productRouter.post("/add", upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'logo', maxCount: 1 }
]), addProduct);

productRouter.get("/all", getAllProducts);
productRouter.post("/details", getProductDetails);

export default productRouter;
