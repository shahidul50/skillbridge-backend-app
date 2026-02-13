import config from "../lib/config";
import { prisma } from "../lib/prisma";
import { UserRole } from "../middleware/authMiddleware";

async function seedAdmin() {
    try {
        console.log("**** Admin Seeding Started.....");
        const adminData: { name: string, email: string, role: string, password: string } = {
            name: config.seeding_acc_name || 'Supper Admin',
            email: config.seeding_acc_email || 'admin@skillbridge.com',
            role: UserRole.ADMIN,
            password: config.seeding_acc_pass || 'Password123',
        };
        console.log("**** Checking admin exist or not");
        //check admin data exist or not
        const existingUser = await prisma.user.findUnique({
            where: {
                email: adminData.email,
            },
        });

        if (existingUser) {
            throw new Error("User Already exists!!");
        }

        const signUpAdmin = await fetch(
            "http://localhost:5000/api/auth/sign-up/email",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Origin': config.better_auth_url! || 'http://localhost:5000',

                },
                body: JSON.stringify(adminData),
            }
        );

        if (signUpAdmin.ok === false) {
            console.log(signUpAdmin)
            throw new Error("Can't create admin user!");
        }

        //update email by manually
        if (signUpAdmin.ok) {
            console.log("**** Admin created successfully.");
            await prisma.user.update({
                where: {
                    email: adminData.email,
                },
                data: {
                    emailVerified: true,
                },
            });

            console.log("**** Email Verification Status Updated");
        }


        console.log("**** Admin Seeding Finish ****");
    } catch (error) {
        console.log(error);
    }
}

seedAdmin();
