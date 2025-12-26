import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found or token invalid" });
    }
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - 30);
  const existingDates = user.usageHistory?.map(d => d.toISOString().split("T")[0]) || [];
if (!existingDates.includes(todayStr)) {
  user.usageHistory.push(today);
}

    user.usageHistory = user.usageHistory.filter(
      d => new Date(d) >= cutoffDate
    );
    user.lastActive = today;
     await user.save({ validateBeforeSave: false })

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};


export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const requireSubscription = async (req, res, next) => {
  const user = req.user;
  if (!user || !user.subscription?.isActive) {
    return res.status(403).json({ message: "Subscription required" });
  }

  const now = new Date();
  if (new Date(user.subscription.endDate) < now) {
    return res.status(403).json({ message: "Subscription expired" });
  }

  next();
};



