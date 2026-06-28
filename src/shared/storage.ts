import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { randomUUID } from "crypto";

let s3Client: S3Client | null = null;

if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
  const endpoint = env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  s3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  folder: string = "uploads"
): Promise<{ key: string; bucket: string }> {
  const bucketName = env.R2_BUCKET_NAME || "gaza40-documents";
  const uniqueId = randomUUID();
  const extension = filename.split(".").pop();
  const key = `${folder}/${uniqueId}.${extension}`;

  if (!s3Client) {
    const fs = await import("fs/promises");
    const path = await import("path");
    const localPath = path.join(process.cwd(), key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    return { key, bucket: "local_private" };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);
  return { key, bucket: bucketName };
}

export async function uploadFileToStorage(
  filePath: string,
  filename: string,
  mimetype: string,
  folder: string = "uploads"
): Promise<{ key: string; bucket: string }> {
  const bucketName = env.R2_BUCKET_NAME || "gaza40-documents";
  const uniqueId = randomUUID();
  const extension = filename.split(".").pop();
  const key = `${folder}/${uniqueId}.${extension}`;

  if (!s3Client) {
    const fs = await import("fs/promises");
    const path = await import("path");
    const localPath = path.join(process.cwd(), key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.copyFile(filePath, localPath);
    return { key, bucket: "local_private" };
  }

  const fs = await import("fs");
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: mimetype,
  });

  await s3Client.send(command);
  return { key, bucket: bucketName };
}

export async function getSignedStorageUrl(
  key: string,
  bucket?: string,
  expiresInSeconds: number = 3600,
  downloadFilename?: string
): Promise<string | null> {
  const targetBucket = bucket || env.R2_BUCKET_NAME || "gaza40-documents";
  if (!s3Client || targetBucket === "local_private") {
     // Return null for local files; caller should handle fallback logic
     return null;
  }

  const command = new GetObjectCommand({
    Bucket: targetBucket,
    Key: key,
    ...(downloadFilename && {
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(downloadFilename)}"`
    })
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.error("Failed to generate signed URL:", error);
    return null;
  }
}

export async function deleteFromStorage(key: string, bucket?: string): Promise<boolean> {
  const targetBucket = bucket || env.R2_BUCKET_NAME || "gaza40-documents";
  if (!s3Client || targetBucket === "local_private") {
     // Fallback to local file system
     try {
       const fs = await import("fs/promises");
       const path = await import("path");
       await fs.unlink(path.join(process.cwd(), key));
       return true;
     } catch (error) {
       console.error("Failed to delete local file:", error);
       return false;
     }
  }

  const command = new DeleteObjectCommand({
    Bucket: targetBucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Failed to delete file from R2:", error);
    return false;
  }
}
