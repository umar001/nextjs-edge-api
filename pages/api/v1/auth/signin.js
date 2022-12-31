import { StatusCodes } from "http-status-codes"
import { verifyPassword } from "../../../../lib/auth"
import { createJwtToken } from "../../../../lib/jwtToken"
import prisma from "../../../../lib/prisma"
import returnResponse from "../../../../utils/returnResponse"

export const config = {
    runtime: 'edge',
}
export default async (req) => {
    try {
        const { email, password } = req.body
        if (!email) {
            return returnResponse({ status: StatusCodes.BAD_REQUEST, message: "Email is required", data: {} }, StatusCodes.BAD_REQUEST)
        }
        if (!password) {
            return returnResponse({ status: StatusCodes.BAD_REQUEST, message: "Password is required", data: {} }, StatusCodes.BAD_REQUEST)
        }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return returnResponse({ status: StatusCodes.NOT_FOUND, message: "User not exists", data: {} }, StatusCodes.NOT_FOUND)
        }
        const verify = await verifyPassword(password, user.password)
        if (verify) {
            const token = createJwtToken({ _id: user.id, email: user.email, username: user.username, createdAt: user.createdAt })
            return returnResponse({ status: StatusCodes.OK, data: { token }, message: "signin successfully" }, StatusCodes.OK)
        }
        return returnResponse({ status: StatusCodes.NOT_FOUND, message: "Wrong username and password", data: {} }, StatusCodes.NOT_FOUND)


    } catch (error) {
        console.log(error)
        return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: 'failed to load data' }, StatusCodes.INTERNAL_SERVER_ERROR)
    }
}