import { verifyJwtToken } from "../../../lib/jwtToken"
import { userAuthenticate } from "../../../lib/auth"
import prisma from "../../../lib/prisma"
import { body, validationResult } from "express-validator"
import { StatusCodes } from "http-status-codes"


export default async (req, res) => {
    try {
        await userAuthenticate(req, res)
        switch (req.method) {
            case 'POST':
                addCards()
                break;

            default:
                return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: 'This method not supported', status: StatusCodes.METHOD_NOT_ALLOWED });
                break;
        }
        res.status(200).json({ message: 'users' })
    } catch (error) {
        // console.log(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data' })
    }
}

async function addCards(req, res) {
    body('name').isString()
    body('status').isBoolean()
    body('price').isInt()
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array(), status: StatusCodes.BAD_REQUEST });
    }
    const { name, status, price } = req.body

}

