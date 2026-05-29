/* ═══════════════════════════════════════════════════════════════
   utils/cloudUpload.js
   Swap in your preferred storage provider below.
═══════════════════════════════════════════════════════════════ */

import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"; // npm i streamifier

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a Multer memory-buffer file to Cloudinary.
 * @param {Express.Multer.File} file
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloud = (file, folder = "products") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${folder ? folder : "products"}`, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

/**
 * Delete a file from Cloudinary by its public_id.
 * @param {string} publicId
 */
export const deleteFromCloud = (publicId) =>
  cloudinary.uploader.destroy(publicId);

/* ─── If you prefer local disk (development) ────────────────────
import fs   from "fs";
import path from "path";

const UPLOAD_DIR = path.resolve("public/uploads/products");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadToCloud = async (file) => {
  const filename   = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
  const filepath   = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(filepath, file.buffer);
  return { secure_url: `/uploads/products/${filename}`, public_id: filename };
};

export const deleteFromCloud = async (publicId) => {
  const filepath = path.join(UPLOAD_DIR, publicId);
  if (fs.existsSync(filepath)) await fs.promises.unlink(filepath);
};
─────────────────────────────────────────────────────────────── */
