import multer from "multer";

const maxUploadSizeBytes = 5 * 1024 * 1024; // 5MB limit for chat attachments

export const uploadChatAttachment = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeBytes
  },
  fileFilter: (_req, file, callback) => {
    // Only allow specific types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Invalid file type. Only images, PDFs, and Word documents are allowed."));
    }
  }
});
