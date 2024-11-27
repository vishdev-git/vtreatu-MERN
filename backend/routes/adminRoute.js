import express from "express";
import {
  addDoctor,
  adminDashboard,
  allDoctors,
  appointmentsAdmin,
  cancelAppointment,
  loginAdmin,
} from "../controllers/adminController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const adminRouter = express.Router();

adminRouter.post("/add-doctors", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);

//Protected Routes
adminRouter.post("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, cancelAppointment);
adminRouter.get("/dashboard", authAdmin, adminDashboard);

export default adminRouter;
