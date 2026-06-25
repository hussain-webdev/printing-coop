import mongoose from "mongoose";

const wholesaleSellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    address2: { type: String },
    companyName: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    website: { type: String },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { minimize: false }
);

const wholesaleSellerModel = mongoose.models.wholesaleSeller || mongoose.model("wholesaleSeller", wholesaleSellerSchema);

export default wholesaleSellerModel;
