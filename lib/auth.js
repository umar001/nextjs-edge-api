import { hash, compare } from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import { verifyJwtToken } from './jwtToken';

export async function hashPassword(password) {
    const hashedPassword = await hash(password, 12);
    return hashedPassword;
}

export async function verifyPassword(password, hashedPassword) {
    const isValid = await compare(password, hashedPassword);
    return isValid;
}

export function userAuthenticate(req, res) {
    try {
        let token = req.headers.authorization
        token = token.replace('Bearer ', '')
        const parseToken = verifyJwtToken(token)
        // console.log(parseToken)
        // res.setHeader('Content-Type', 'application/json');
        if (!parseToken) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ message: "Your token is expired", status: StatusCodes.NOT_ACCEPTABLE })
        }
        return true
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data', status: StatusCodes.INTERNAL_SERVER_ERROR })
    }
}
export function getTokenVal(token) {
    return token.replace('Bearer ', '')
}