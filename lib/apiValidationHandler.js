import { check, validationResult } from 'express-validator'
import { StatusCodes } from 'http-status-codes';
import nextConnect from 'next-connect';
import { verifyJwtToken, getTokenVal } from './jwtToken';

const initValidation = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map((validation) => validation.run(req)))
        const errors = validationResult(req)
        if (errors.isEmpty()) return next()
        const err = []
        errors.array().map(error => err.push(error.msg))

        //status: 400 Bad Request
        res.status(400).json({ success: false, data: null, error: err })
    }
}

const checkAuth = (req, res, next) => {
    const parseToken = verifyJwtToken(getTokenVal(req.headers.authorization))
    if (!parseToken) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({ message: "Your token is expired", status: StatusCodes.NOT_ACCEPTABLE })
    }
    return next()
}

const onError = (err, req, res) => {
    return res.status(500).end(err.toString());
}

// u can customize where your validator runs
// for example u can use this for validate your PUT request :
// const put = (middleware) => {
//     return nextConnect().put(middleware)
// }

// when u call this its ONLY run in post request
const post = (middleware) => {
    return nextConnect().post(middleware)
}

// u can set onError , onNoMatch and global middleware or etc
//  handler = nextConnect({ onError, onNoMatch }).use(SOME_MIDDLEWARE) 
const handler = nextConnect({ onError })
export default handler
export { initValidation, post, check, checkAuth, onError }
