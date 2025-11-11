import { Router } from "express";
import * as UserController from "../Controllers/UserController.js";
import { protect } from "../middleware/Auth.js";

const router = Router();

router.get("/", UserController.getUsers);
router.post("/login", UserController.login);
router.post("/", UserController.register);
router.put("/", protect, UserController.updateProfile);
router.put("/password", protect, UserController.changePassword);
router.delete("/", protect, UserController.deleteUser);

export default router;
