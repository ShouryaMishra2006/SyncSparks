import { Router } from "express"
import passport from "passport";
import { requireAuth } from "../middleware/authMiddleware"
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
  (req, res) => {
    try {
      const stateParam = req.query.state as string;
      const { role } = JSON.parse(decodeURIComponent(stateParam));

      if (role === "writer-director") {
        res.redirect("http://localhost:3000/writer-confirm");
      } else {
        res.redirect(`http://localhost:3000/dashboard/${role}`);
      }
    } catch (err) {
      console.error("Error in Google callback:", err);
      res.redirect("http://localhost:3000/login");
    }
  }
);


router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user }) 
})
router.post("/signup", signup)
router.post("/verify-otp", verifyOtp)
router.post("/login", login)

export default router
