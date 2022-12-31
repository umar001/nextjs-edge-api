import { getToken } from "next-auth/jwt"
import { hashPassword } from "../../../lib/auth"
import prisma from "../../../lib/prisma"
// import { PrismaClient } from "@prisma/client"
import { StatusCodes } from "http-status-codes"
import { sendEmailVerification } from "../../../lib/mail/mail"
import { randomNum } from "../../../utils/helper"

// const prisma = new PrismaClient()
const secret = process.env.NEXTAUTH_SECRET


export default async function handler(req, res) {
    try {
        // const {user, pa}
        if (req.method !== 'POST') {
            return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ status: StatusCodes.METHOD_NOT_ALLOWED, message: 'This method not supported' });
        }
        if (req.method === 'POST') {
            const { name, email, password } = req.body
            const checkUser = await prisma.user.findMany({
                where: {
                    email
                }
            })
            if (checkUser.length) {
                return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "Email address is already exist please login." })
            }
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: await hashPassword(password)
                },
                select: {
                    name: true,
                    email: true,
                    id: true
                }

            })
            if (user) {
                const random = randomNum()
                await sendEmailVerification(email, random)
                const verifyEmail = await prisma.emailVerification.findFirst({
                    where: {
                        userId: user.id
                    }
                })
                if (verifyEmail) {
                    await prisma.emailVerification.update({
                        where: {
                            id: verifyEmail.id
                        },
                        data: {
                            code: random,
                            userId: user.id
                        }
                    })
                } else {
                    console.log(user.id)
                    await prisma.emailVerification.create({
                        data: {
                            userId: user.id,
                            code: random
                        }
                    })
                }
            }
            return res.status(StatusCodes.OK).json({ status: StatusCodes.OK })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'failed to load data' })
    }

}