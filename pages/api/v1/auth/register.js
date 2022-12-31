import { getToken } from "next-auth/jwt"
import { hashPassword } from "../../../../lib/auth"
import { PrismaClient } from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import prisma from "../../../../lib/prisma"

// const prisma = new PrismaClient()
const secret = process.env.NEXTAUTH_SECRET

export default async function handler(req, res) {
    try {
        const { email, name, password } = req.body
        if (req.method !== 'POST') {
            return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: 'This method not supported', status: StatusCodes.METHOD_NOT_ALLOWED });
        }
        if (req.method === 'POST') {
            const user = await prisma.user.findMany({ where: { email } })
            if (user.length > 0) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: 'User already exists' });
            }
            const createUser = await prisma.user.create({
                data: {
                    email,
                    password: await hashPassword(password),
                    name: name,
                }
            })
            return res.status(StatusCodes.OK).json({ name: 'John Doe', user: createUser })
        }

    } catch (error) {
        console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data' })
    }

}

