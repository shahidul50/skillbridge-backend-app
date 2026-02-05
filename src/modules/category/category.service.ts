import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

//get all categories
const getAllCategories = async () => {
    console.log("Get All Categories Function from category.service.ts")
}

//check if category name already exists
const isExistingCategory = async (name: string) => {
    return await prisma.category.findUnique({
        where: {
            name
        },
    });
}

//create new category
const createCategory = async (data: { name: string, image: string }) => {

    const result = await prisma.category.create({
        data: {
            name: data.name,
            image: data.image,
        },
    });

    return result;
}

const categoryService = {
    getAllCategories,
    createCategory,
    isExistingCategory
}


export default categoryService;