import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import path from "path";
import multer from "multer";
import { ApiError } from "../../shared/http";
import {
  allowedFileExtensions,
  allowedMimeTypes,
  maxUploadSizeBytes,
  privateUploadRoot
} from "./document.constants";

const uploadDirectory = path.join(process.cwd(), privateUploadRoot);
mkdirSync(uploadDirectory, { recursive: true });

export const uploadSingleDocument = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDirectory);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: {
    fileSize: maxUploadSizeBytes
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedMimeTypes.has(file.mimetype) || !allowedFileExtensions.has(extension)) {
      callback(new ApiError(400, "Only PDF, JPG, JPEG, and PNG files are allowed"));
      return;
    }

    callback(null, true);
  }
}).single("file");
