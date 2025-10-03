import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"

export interface AuthRequest extends Request {
  user?: any
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token
    console.log(token)
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    console.log(decoded)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    console.log(user)
    req.user = user
    next()
  } catch (err) {
    console.error("Auth error:", err)
    res.status(401).json({ message: "Invalid or expired token" })
  }
}
