import { prisma } from "../../lib/prisma";
import { TContactMessageBody } from "../../types/contact.type";
import { sendEmail } from "../../utils/emailSender";
import config from "../../lib/config";

const createContactMessage = async (payload: TContactMessageBody) => {
    const { fullName, email, role, subject, message } = payload;
    const newMessage = await prisma.contactMessage.create({
        data: { fullName, email, role, subject, message },
    });

    const adminEmail = "abdushah49@gmail.com";

    const mailOptions = {
        to: adminEmail,
        subject: `SkillBridge Contact: ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #007a3d; border-bottom: 2px solid #007a3d; padding-bottom: 10px;">New Contact Message</h2>
                <p><strong>Full Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> ${role}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #007a3d;">
                    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                <p style="font-size: 12px; color: #777; margin-top: 20px;">This message was also saved successfully to the database (ID: ${newMessage.id}).</p>
            </div>
        `,
    } as const;

    try {
        await sendEmail({
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            from: `"${fullName} (${role})" <${config.email_user}>`,
            replyTo: email,
        });
    } catch (err) {
        console.error("Failed to send contact email:", err);
    }

    return newMessage;
};

export const contactService = {
    createContactMessage,
};