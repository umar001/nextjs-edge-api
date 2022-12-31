import { verifyJwtToken, getTokenVal } from "../lib/jwtToken"


export const getUserFromToken = (req) => {
    return verifyJwtToken(getTokenVal(req.headers.authorization))
}