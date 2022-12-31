import React from "react";
import prisma from "../../../lib/prisma"
import { getCsrfToken } from "next-auth/react";
import { randomNum } from "../../../utils/helper";
import { sendEmailVerification } from "../../../lib/mail/mail";
import { StatusCodes } from "http-status-codes";

export default async function handler(req, res) {
    try {
        const csrfToken = await getCsrfToken({ req })
        console.log(csrfToken)
        if (csrfToken) {
            if (req.method !== 'POST') {
                return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ status: StatusCodes.METHOD_NOT_ALLOWED, message: 'This method not supported' });
            }
            if (req.method === 'POST') {
                const { email } = req.body
                if (!email) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "Email is required" })
                }
                const user = await prisma.user.findUnique({
                    where: {
                        email
                    }
                })
                if (user) {
                    const random = randomNum()
                    let emailVerification = await prisma.emailVerification.findFirst({
                        where: {
                            userId: user.id
                        }
                    })
                    if (emailVerification) {
                        emailVerification = await prisma.emailVerification.update({
                            where: {
                                id: emailVerification.id
                            },
                            data: {
                                code: random
                            }
                        })
                    } else {
                        emailVerification = await prisma.emailVerification.create({
                            data: {
                                userId: user.id,
                                code: random
                            }
                        })
                    }
                    if (emailVerification) {
                        const mail = await sendEmailVerification(email, random)
                        console.log(mail)
                        return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: "OTP successfully sent" })
                    }
                } else {
                    return res.status(StatusCodes.NOT_FOUND).json({ status: StatusCodes.NOT_FOUND, message: "User not exist please register" })
                }
            }
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: "Not signed in" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'failed to load data' })
    }
}