export enum Role {
    ADMIN = "ADMIN",
    TUTOR = "TUTOR",
    STUDENT = "STUDENT"
}

export type TGETUserProfileByIdResponse = {
    id: string;
    name: string;
    email: string;
    role: Role.STUDENT;
    image: string | null;
    phoneNumber: string;
    updatedAt: string;
}

export type TUpdateUserProfileByIdBodyData = {
    name: string;
    image: string|null;
    phoneNumber: string;
}

export type TUpdateUserProfileByIdResponse = {
    id: string;
    name: string;
    email: string;
    role: Role.STUDENT;
    image: string | null;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
}