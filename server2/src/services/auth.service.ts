import prisma from "../lib/prisma.js"

export const login = async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.users.findUnique({
        where: {
            email: req.body.email
        }
    });