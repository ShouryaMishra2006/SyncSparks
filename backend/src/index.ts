import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import passport from "passport"
import connectDB from "./config/db"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/authRoutes"
import performerRoutes from "./routes/performerRoutes"
import "./config/passport"

dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 4000

//app.use(cors())
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json())
app.use(cookieParser()) 
app.get("/", (req, res) => {
  res.json({ message: "Backend API running" })
})

app.use(passport.initialize());
app.use("/api/auth", authRoutes)
app.use("/api/performer",performerRoutes)

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
