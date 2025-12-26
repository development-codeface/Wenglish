// routes/pushMessages.routes.js
import express from "express";
import {
  createPushMessage,
  getAllPushMessages,
  updatePushMessage,
  deletePushMessage,
  getAllMultilingualMessages
} from "../controller/pushMessage.controller.js";
import { uploadImages } from "../middlewares/upload.Instance.js";

const router = express.Router();

router.post(
  "/",
  uploadImages.single("imageUrl"),
  createPushMessage
);



router.get("/", getAllPushMessages);
router.get("/all", getAllMultilingualMessages);
router.put(
  "/:id",
  uploadImages.single("imageUrl"),
  updatePushMessage
);router.delete("/:id", deletePushMessage);

export default router;
