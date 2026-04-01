import { getCloudinaryClient } from "../config/cloudinary";

type UploadImageOptions = {
  folder?: string;
  publicId?: string;
};

export async function uploadImage(
  fileBuffer: Buffer,
  options: UploadImageOptions = {},
): Promise<string> {
  const cloudinary = getCloudinaryClient();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "saksgram/avatars",
        public_id: options.publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    upload.end(fileBuffer);
  });
}
