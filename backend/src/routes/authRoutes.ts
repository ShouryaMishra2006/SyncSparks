import { Router } from "express";
import passport from "passport";
import { requireAuth } from "../middleware/authMiddleware";
import {
  googleCallback,
  signup,
  verifyOtp,
  login,
  logout,
} from "../controllers/authController";

const router = Router();
router.get("/google", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: req.query.state as string,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallback
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/logout", logout);

export default router;
