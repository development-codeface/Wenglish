import UserCall from "../models/dailyLimit.model.js";

/**
 * Helper: check if two dates are the same day
 */
const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

/**
 * Check remaining seconds for user
 */
export const checkUserDuration = async (userId) => {
  try {
    const now = new Date();
    let userCall = await UserCall.findOne({ userId });

    if (!userCall) {
      userCall = new UserCall({ userId });
      await userCall.save();
      return { allowed: true, remainingSeconds: userCall.dailyLimit };
    }

    // Reset daily limit if a new day
    if (!userCall.lastUsed || !isSameDay(userCall.lastUsed, now)) {
      userCall.remainingSeconds = userCall.dailyLimit;
      userCall.lastUsed = now;
      userCall.callStart = null;
      await userCall.save();
    }

    const allowed = userCall.remainingSeconds > 0;
    return { allowed, remainingSeconds: userCall.remainingSeconds };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Start a call
 */
export const startCall = async (userId) => {
  try {
    const now = new Date();
    let userCall = await UserCall.findOne({ userId });
    if (!userCall) userCall = new UserCall({ userId });

    if (!userCall.lastUsed || !isSameDay(userCall.lastUsed, now)) {
      userCall.remainingSeconds = userCall.dailyLimit;
    }

    if (userCall.remainingSeconds <= 0) {
      return { allowed: false, message: "Daily limit reached" };
    }

    userCall.callStart = now;
    userCall.lastUsed = now;
    await userCall.save();

    return {
      allowed: true,
      remaining: userCall.remainingSeconds,
      message: "Call started",
    };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Stop a call
 */
export const stopCall = async (userId) => {
  try {
    const now = new Date();
    const userCall = await UserCall.findOne({ userId });

    if (!userCall || !userCall.callStart) {
      return { remaining: userCall?.remainingSeconds || 0, message: "Call not active" };
    }

    const elapsed = Math.floor((now - userCall.callStart) / 1000);
    userCall.remainingSeconds = Math.max(userCall.remainingSeconds - elapsed, 0);
    userCall.callStart = null;
    userCall.lastUsed = now;
    await userCall.save();

    return { remaining: userCall.remainingSeconds, message: "Call stopped" };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Recharge call seconds
 */
export const rechargeUserController = async (userId, seconds = 60) => {
  try {
    let userCall = await UserCall.findOne({ userId });
    if (!userCall) userCall = new UserCall({ userId });

    userCall.remainingSeconds += seconds;
    await userCall.save();

    return { remaining: userCall.remainingSeconds, message: `${seconds} seconds added` };
  } catch (err) {
    return { error: err.message };
  }
};
