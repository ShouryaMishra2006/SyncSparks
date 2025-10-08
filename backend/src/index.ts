import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import passport from "passport"
import connectDB from "./config/db"
import cookieParser from "cookie-parser"
import http from "http";
const { Server } = require("socket.io");
import authRoutes from "./routes/authRoutes"
import performerRoutes from "./routes/performerRoutes"
import "./config/passport"




dotenv.config()
connectDB()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json())
app.use(cookieParser()) 
app.get("/", (req, res) => {
  res.json({ message: "Backend API running" })
})



app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/performer",performerRoutes)
// app.use("/api/mindmap", mindmapRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend
    methods: ["GET", "POST"],

    credentials: true,
  },
});



server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})