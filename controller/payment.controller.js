import Payment from "../models/payment.model.js";


// GET ALL PAYMENTS (Admin)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("plan", "title price");

    return res.status(200).json({ status: true, payments });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// GET PAYMENT BY ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email")
      .populate("plan", "title price");

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      status: true,
      payment
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// UPDATE PAYMENT (status, address, amount, plan, etc.)
export const updatePayment = async (req, res) => {
  try {
    const update = req.body;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment updated successfully",
      payment
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// DELETE PAYMENT
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// GET LOGGED-IN USER'S PAYMENT HISTORY
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("plan", "title price");

    return res.status(200).json({
      status: true,
      payments
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};