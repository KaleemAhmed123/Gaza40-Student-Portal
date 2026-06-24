import { uploadToStorage } from "../src/shared/storage";

async function runR2Test() {
  console.log("=== Starting R2 Storage Test ===\n");

  const dummyContent = Buffer.from("Hello Gaza40+, this is a test document uploaded directly to R2!");

  try {
    console.log("Uploading test file to 'documents' folder...");
    const result1 = await uploadToStorage(dummyContent, "test-doc.txt", "text/plain", "documents");
    console.log("✅ File 1 uploaded successfully!");
    console.log(`Key: ${result1.key}`);
    console.log(`Bucket: ${result1.bucket}\n`);

    console.log("Uploading test file to 'chat/12345' folder...");
    const result2 = await uploadToStorage(dummyContent, "test-chat-image.txt", "text/plain", "chat/12345");
    console.log("✅ File 2 uploaded successfully!");
    console.log(`Key: ${result2.key}`);
    console.log(`Bucket: ${result2.bucket}\n`);

    console.log("=== Test Complete! ===");
    console.log("Check your Cloudflare dashboard under your bucket to verify the files appear in the 'documents' and 'chat' folders.");
  } catch (error) {
    console.error("❌ R2 Upload Failed:");
    console.error(error);
  }
}

runR2Test();
