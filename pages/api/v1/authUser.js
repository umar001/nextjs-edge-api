import { verifyJwtToken } from "../../../lib/jwtToken"
import { getTokenVal } from "../../../lib/auth"
import prisma from "../../../lib/prisma"
import { StatusCodes } from "http-status-codes"


export default async (req, res) => {
    try {
        const user = authorization(req)
        if (!user) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ message: "Your token is expired", status: StatusCodes.NOT_ACCEPTABLE })
        }
        switch (req.method) {
            case 'GET':
                return await getUsers(user, res)
                break;

            default:
                return res.status(StatusCodes.METHOD_NOT_ALLOWED)
                    .json({ error: StatusCodes.METHOD_NOT_ALLOWED, message: `Method ${req.method} Not Allowed` });
        }
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data' })
    }
}

async function getUsers(user, res) {
    const data = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, email: true, name: true, username: true } })
    return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, user: data })
}

function authorization(req) {
    const parseToken = verifyJwtToken(getTokenVal(req.headers.authorization))
    if (!parseToken) {
        return false
    }
    return parseToken
}