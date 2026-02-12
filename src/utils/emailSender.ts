import nodemailer from 'nodemailer';
import config from '../lib/config';

interface IEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: IEmailOptions) => {
    // create transporter by gmail
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: config.email_user,
            pass: config.email_pass,
        },
    });

    // Setup Email content
    const mailOptions = {
        from: `"SkillBridge App" <${config.email_user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    // Sending Email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};