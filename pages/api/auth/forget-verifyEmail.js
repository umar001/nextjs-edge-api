import React from "react";
import prisma from "../../../lib/prisma"
import { getCsrfToken } from "next-auth/react";
import { randomNum } from "../../../utils/helper";
import { sendEmailVerification } from "../../../lib/mail/mail";
import { StatusCodes } from "http-status-codes";
import moment from "moment";

export default async function handler(req, res) {
    try {
        const csrfToken = await getCsrfToken({ req })
        if (csrfToken) {
            if (req.method !== 'POST') {
                return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ status: StatusCodes.METHOD_NOT_ALLOWED, message: 'This method not supported' });
            }
            if (req.method === 'POST') {
                const { email, otp } = req.body
                if (!email) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "Email is required" })
                }
                if (!otp) {
                    return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "OTP is required" })
                }
                const user = await prisma.user.findUnique({
                    where: {
                        email
                    }
                })
                if (user) {
                    const emailVerification = await prisma.emailVerification.findFirst({
                        where: {
                            userId: user.id
                        }
                    })
                    console.log(emailVerification)
                    const otpTimestamp = emailVerification.updatedAt
                    const otpDate = moment(otpTimestamp).add(15, 'm').unix()
                    const currentDatetime = moment().unix()
                    if (currentDatetime > otpDate) {
                        return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: StatusCodes.NOT_ACCEPTABLE, message: "OTP is expired please resend OTP" })
                    }
                    console.log(typeof otp, typeof emailVerification.code)
                    if (parseInt(otp) === emailVerification.code) {
                        await prisma.user.update({
                            where: {
                                id: user.id
                            },
                            data: {
                                emailVerified: new Date()
                            }
                        })
                        return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: "Successfully verified" })
                    } else {
                        return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: "Wrong OTP" })
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