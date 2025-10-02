import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails?.[0].value });

        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails?.[0].value,
            isVerified: true,
            provider: "google",
          });
          await user.save();
        }

        return done(null, { user });
      } catch (err) {
        console.log(err)
      }
    }
  )
);
