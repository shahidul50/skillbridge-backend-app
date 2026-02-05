import { prisma } from "../../lib/prisma";

//get all categories
const getAllCategories = async (payload: {
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: string;
    searchTerm: string | undefined;
}) => {

    // Search and filter options
    const whereOptions = payload.searchTerm ? {
        name: {
            contains: payload.searchTerm,
            mode: 'insensitive' as const,
        }
    } : {};

    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            where: whereOptions,
            skip: payload.skip,
            take: payload.limit,
            orderBy: {
                [payload.sortBy]: payload.sortOrder,
            },
        }),
        prisma.category.count({ where: whereOptions }),
    ]);
    return {
        data: categories,
        pagination: {
            total,
            page: payload.page,
            limit: payload.limit,
            totalPages: Math.ceil(total / payload.limit),
        }
    }
};

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

    return await prisma.category.create({
        data: {
            name: data.name,
            image: data.image,
        },
    });
}

const categoryService = {
    getAllCategories,
    createCategory,
    isExistingCategory
}


export default categoryService;