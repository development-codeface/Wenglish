import UserCall from "../models/dailyLimit.model.js";

/**
 * Helper: check if two dates are the same day
 */
const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

/**
 * Automatically reset all users to 60 seconds every 1 minute (for testing)
 */
const resetAllUsers = async () => {
  try {
    const users = await UserCall.find({});
    const now = new Date();

    for (const user of users) {
      user.remainingSeconds = 60; // reset daily free seconds
      user.callStart = null;       // clear any active call
      user.lastUsed = now;         // update last used date
      await user.save();
      console.log(`✅ Reset daily limits for user ${user.userId} at ${now}`);
    }
  } catch (err) {
    console.error("Error resetting users:", err.message);
  }
};

/**
 * Schedule daily reset at specific hour and minute
 */
const scheduleSpecificReset = (hour = 0, minute = 0) => { // midnight
  const now = new Date();
  const resetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );

  // If the time already passed today, schedule for tomorrow
  if (resetTime <= now) {
    resetTime.setDate(resetTime.getDate() + 1);
  }

  const msUntilReset = resetTime.getTime() - now.getTime();

  setTimeout(async () => {
    await resetAllUsers();
    console.log(`✅ Daily limits reset at ${hour}:${minute}`);

    // Repeat every 24 hours
    setInterval(async () => {
      await resetAllUsers();
      console.log(`✅ Daily limits reset at ${hour}:${minute}`);
    }, 24 * 60 * 60 * 1000);
  }, msUntilReset);
};

// Start the scheduler
scheduleSpecificReset(0, 0); // 12:00 AM





/**
 * Check remaining seconds for user (live)
 */
export const checkUserDuration = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    let userCall = await UserCall.findOne({ userId });

    if (!userCall) {
      userCall = new UserCall({ userId, remainingSeconds: 60 });
      await userCall.save();
      return res.json({ allowed: true, remainingSeconds: 60 });
    }

    // Deduct live call time
    let remaining = userCall.remainingSeconds;
    if (userCall.callStart) {
      const elapsed = Math.floor((now - userCall.callStart) / 1000);
      remaining = Math.max(remaining - elapsed, 0);
    }

    return res.json({
      allowed: remaining > 0,
      remainingSeconds: remaining,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Start a call
 */
export const startCall = async (req, res) => {
  try {
    const userId = req.user._id;
    let userCall = await UserCall.findOne({ userId });
    if (!userCall) {
      userCall = new UserCall({ userId, remainingSeconds: 60 });
    }

    if (userCall.remainingSeconds <= 0) {
      return res.status(403).json({
        allowed: false,
        message: "Daily limit reached. Please recharge.",
      });
    }

    userCall.callStart = new Date();
    await userCall.save();

    return res.json({
      allowed: true,
      remaining: userCall.remainingSeconds,
      message: "Call started",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Stop a call
 */
export const stopCall = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const userCall = await UserCall.findOne({ userId });

    if (!userCall || !userCall.callStart) {
      return res.json({
        remaining: userCall?.remainingSeconds || 0,
        message: "Call not active",
      });
    }

    const elapsed = Math.floor((now - userCall.callStart) / 1000);
    userCall.remainingSeconds = Math.max(userCall.remainingSeconds - elapsed, 0);
    userCall.callStart = null;
    await userCall.save();

    return res.json({
      remaining: userCall.remainingSeconds,
      elapsed,
      message: "Call stopped",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Recharge call seconds
 */
export const rechargeUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, transactionId, duration } = req.body;

    if (!amount || !transactionId || !duration) {
      return res.status(400).json({
        error: "Missing required fields: amount, transactionId, duration",
      });
    }

    let userCall = await UserCall.findOne({ userId });
    if (!userCall) userCall = new UserCall({ userId, remainingSeconds: 0 });

    userCall.remainingSeconds += Number(duration);
    userCall.rechargeHistory.push({
      amount: Number(amount),
      transactionId: String(transactionId),
      duration: Number(duration),
      rechargeDate: new Date(),
    });

    await userCall.save();

    return res.json({
      success: true,
      remaining: userCall.remainingSeconds,
      message: `${duration} seconds added`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getRechargeHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    let userCall = await UserCall.findOne({ userId });

    if (!userCall || !userCall.rechargeHistory.length) {
      return res.json({
        success: true,
        message: "No recharge history found",
        rechargeHistory: [],
      });
    }

    // Optionally sort by latest recharge first
    const sortedHistory = userCall.rechargeHistory.sort(
      (a, b) => b.rechargeDate - a.rechargeDate
    );

    return res.json({
      success: true,
      rechargeHistory: sortedHistory,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
