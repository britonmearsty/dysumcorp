import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

const SVG_MIME = /svg/i;

export const uploadToCloudinary = async (
  fileUri: string,
  folder: string = "dysumcorp",
) => {
  const isSvg = SVG_MIME.test(fileUri);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileUri,
      {
        folder,
        resource_type: isSvg ? "image" : "auto",
        ...(isSvg && { format: "svg", allowed_formats: ["svg"] }),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
  });
};
