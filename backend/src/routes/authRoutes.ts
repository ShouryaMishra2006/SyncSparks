import { Router } from "express"
import passport from "passport";
import { googleCallback,signup, verifyOtp, login } from "../controllers/authController"

const router = Router()
router.get(
  "/google",
  (req, res, next) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: req.query.state as string,
    })(req, res, next);
  }
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback
);

router.post("/signup", signup)
router.post("/verify-otp", verifyOtp)
router.post("/login", login)

export default router
