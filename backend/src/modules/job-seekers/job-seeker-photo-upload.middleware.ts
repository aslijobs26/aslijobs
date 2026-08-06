import multer from "multer";
import {
  JOB_SEEKER_IMAGE_MIME_TYPES,
  JOB_SEEKER_PROFILE_PHOTO_MAX_SIZE_BYTES,
} from "../../constants/job-seeker.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";

const memoryStorage = multer.memoryStorage();

export const jobSeekerProfilePhotoUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: JOB_SEEKER_PROFILE_PHOTO_MAX_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!(JOB_SEEKER_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(
        new AppError(
          "Profile photo must be a PNG, JPG, JPEG, or WEBP image",
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }

    callback(null, true);
  },
}).single("profilePhoto");
