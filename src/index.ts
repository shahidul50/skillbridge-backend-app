import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 5000;

async function main() {
    try {
        await prisma.$connect();
        console.log("Database connected successfully.");

        if (process.env.NODE_ENV !== 'production') {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`)
            })
        }
    } catch (error) {
        console.error("An error occurred:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// In production (Vercel), we don't need to call listen or connect manually here
// as the serverless function will handle it or we can connect on demand.
// However, for local development, we call main.
if (process.env.NODE_ENV !== 'production') {
    main();
}

export default app;