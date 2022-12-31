import React from "react";
import prisma from "../../../lib/prisma"
import { getCsrfToken } from "next-auth/react";
import { StatusCodes } from "http-status-codes";
import { hashPassword } from "../../../lib/auth"

export default async function handler(req, res) {
    try {
        const csrfToken = await getCsrfToken({ req })
        console.log(csrfToken)
        if (csrfToken) {
            if (req.method !== 'POST') {
                return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ status: StatusCodes.METHOD_NOT_ALLOWED, message: 'This method not supported' });
            }
            if (req.method === 'POST') {
                const { email, password } = req.body
                if (!email) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "Email is required" })
                }
                if (!password) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "Password is required" })
                }
                const user = await prisma.user.findUnique({
                    where: {
                        email
                    }
                })
                if (user) {
                    await prisma.user.update({
                        where: {
                            email
                        },
                        data: {
                            password: await hashPassword(password),
                            emailVerified: new Date()
                        }
                    })
                    return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: "User password successfully updated" })
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