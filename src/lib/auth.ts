import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { createAuthMiddleware } from "better-auth/api";
import { sendEmail } from "../utils/emailSender";
import config from "./config";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  baseURL: config.better_auth_url,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  trustedOrigins: [config.app_url!, "http://localhost:5000"],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        required: false,
      },
    },
  },
  hooks: {
    before: async (context: any) => {
      // Check if Request object exists
      if (!context.request) {
        return context;
      }
      // Check URL and Body
      const url = new URL(context.request.url);
      const body = context.body as any;
      // Validate Role Field
      if (
        context.body?.role !== undefined &&
        context.body?.role !== "ADMIN" &&
        context.body?.role !== "TUTOR" &&
        context.body?.role !== "STUDENT"
      ) {
        throw new APIError("BAD_REQUEST", {
          message: "Role must be on of STUDENT or TUTOR",
        });
      }

      // Check Signup Endpoint and restrict ADMIN role
      if (url.pathname.endsWith("/sign-up/email")) {
        const requestedRole = body?.role;
        const userEmail = body?.email?.toLowerCase();
        const superAdminEmail = config.seeding_acc_email;

        if (requestedRole === "ADMIN") {
          if (userEmail !== superAdminEmail) {
            context.body.role = "STUDENT";
          }
        }
      }

      if (url.pathname.endsWith("/sign-in/email")) {
        if (!context.body?.email) {
          throw new APIError("BAD_REQUEST", {
            message: "Email is required",
          });
        } else if (!context.body?.password) {
          throw new APIError("BAD_REQUEST", {
            message: "Password is required",
          });
        }
      }
      return context;
    },
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const newAccount: any = ctx.context.returned;
        //check if the new account has a user object
        if (newAccount.user) {
          //checking if the new account is of role TUTOR
          if (newAccount.user.role === "TUTOR") {
            try {
              //create a tutor profile for the new tutor
              await prisma.tutorProfile.create({
                data: {
                  userId: newAccount.user.id,
                  title: "New Tutor",
                  bio: "Bio is empty. Update your profile.",
                  hourlyRate: 0,
                  experience: "Fresh",
                },
              });
              console.log("Tutor Profile Account Created");
            } catch (error: any) {
              console.log("Error creating Tutor Profile Account:", error);
            }
          }
        }
      }
    }),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const verificationUrl = `${config.app_url}/verify-email?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Please verify your email!",
        html: `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Email Verification</title>
                    <style>
                      body {
                        margin: 0;
                        padding: 0;
                        background-color: #f4f6f8;
                        font-family: Arial, Helvetica, sans-serif;
                      }

                      .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                      }

                      .header {
                        background-color: #0f172a;
                        color: #ffffff;
                        padding: 20px;
                        text-align: center;
                      }

                      .header h1 {
                        margin: 0;
                        font-size: 22px;
                      }

                      .content {
                        padding: 30px;
                        color: #334155;
                        line-height: 1.6;
                      }

                      .content h2 {
                        margin-top: 0;
                        font-size: 20px;
                        color: #0f172a;
                      }

                      .button-wrapper {
                        text-align: center;
                        margin: 30px 0;
                      }

                      .verify-button {
                        background-color: #2563eb;
                        color: #ffffff !important;
                        padding: 14px 28px;
                        text-decoration: none;
                        font-weight: bold;
                        border-radius: 6px;
                        display: inline-block;
                      }

                      .verify-button:hover {
                        background-color: #1d4ed8;
                      }

                      .footer {
                        background-color: #f1f5f9;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                        color: #64748b;
                      }

                      .link {
                        word-break: break-all;
                        font-size: 13px;
                        color: #2563eb;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <!-- Header -->
                      <div class="header">
                        <h1>SkillBridge App</h1>
                      </div>

                      <!-- Content -->
                      <div class="content">
                        <h2>Verify Your Email Address</h2>
                        <p>
                          Hello ${user.name} <br /><br />
                          Thank you for registering on <strong>SkillBridge App</strong>.
                          Please confirm your email address to activate your account.
                        </p>

                        <div class="button-wrapper">
                          <a href="${verificationUrl}" class="verify-button">
                            Verify Email
                          </a>
                        </div>

                        <p>
                          If the button doesn’t work, copy and paste the link below into your browser:
                        </p>

                        <p class="link">
                          ${verificationUrl}
                        </p>

                        <p>
                          This verification link will expire soon for security reasons.
                          If you did not create an account, you can safely ignore this email.
                        </p>

                        <p>
                          Regards, <br />
                          <strong>SkillBridge Team</strong>
                        </p>
                      </div>

                      <!-- Footer -->
                      <div class="footer">
                        © 2026 SkillBridge. All rights reserved.
                      </div>
                    </div>
                  </body>
                  </html>
        `,
      });
    },
  },
});
