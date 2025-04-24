import express from "express"
import { logout } from "../controllers/authController.js"

const router = express.Router()

router.post("/logout", logout)

export default router
