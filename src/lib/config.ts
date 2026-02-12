import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
    port: process.env.PORT ? Number(process.env.PORT) : 5000,
    db_url: process.env.DATABASE_URL,
    better_auth_url: process.env.BETTER_AUTH_URL,
    app_url: process.env.APP_URL,
    email_user: process.env.EMAIL_USER,
    email_pass: process.env.EMAIL_PASS,
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
};

export default config;