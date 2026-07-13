
enum ContactMessageRole {
    STUDENT = "STUDENT",
    TUTOR = "TUTOR"
}
export type TContactMessageBody = {
    fullName: string;
    email: string;
    role: ContactMessageRole;
    subject: string;
    message: string;
}