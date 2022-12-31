import { StatusCodes } from "http-status-codes";
import { initValidation, post, check, checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';
import returnResponse from "../../../../utils/returnResponse";

const handler = nc({ onError })
const validator = initValidation(
    [
        check('username').notEmpty().withMessage('username is empty'),
        check('username').isString().withMessage('username invalid value'),

        // all other validation 
    ]
)

export const config = {
    runtime: 'edge',
    unstable_allowDynamic: [
        '/lib/apiValidationHandler.js', // allows a single file
        '/lib/jwtToken.js', // allows a single file
        '/lib/prisma.js', // allows a single file
        '/utils/returnResponse.js', // allows a single file
        'utils/authHelper.js',
        '/node_modules/function-bind/**', // use a glob to allow anything in the function-bind 3rd party module
    ],
}
// define my middleware here and use it only for POST requests
export default handler.use(post(validator)).use(checkAuth)
    .get(async (req) => {
        try {
            const user = getUserFromToken(req)
            let userDetail = await prisma.user.findUnique({
                where: {
                    id: user._id
                },
                select: {
                    username: true,
                }

            })
            return returnResponse({ status: StatusCodes.OK, data: { username: userDetail.username }, message: "Username successfully retrieved" }, StatusCodes.OK)

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: `Duplication found in ${error?.meta?.target}`, data: {} }, StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: 'failed to load data' }, StatusCodes.INTERNAL_SERVER_ERROR)
        }
    })
    .post(async (req) => {
        try {
            const user = getUserFromToken(req)
            const { username } = req.body
            const checkUsername = await prisma.user.findFirst({
                where: { username },
                select: { username: true }
            })
            if (checkUsername?.username) {
                return returnResponse({ status: StatusCodes.BAD_REQUEST, data: {}, message: "Username is already taken" }, StatusCodes.BAD_REQUEST)
            }
            const userDetail = await prisma.user.update({
                where: {
                    id: user._id
                },
                data: {
                    username
                },
                select: {
                    username: true,
                }
            })
            return returnResponse({ status: StatusCodes.OK, data: { username: userDetail.username }, message: "Username successfully updated" }, StatusCodes.OK)

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: `Duplication found in ${error?.meta?.target}` }, StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: 'failed to load data' }, StatusCodes.INTERNAL_SERVER_ERROR)
        }

    })
    .all((req) => {
        return returnResponse({
            status: StatusCodes.METHOD_NOT_ALLOWED,
            data: {},
            message: "Method not allowed",
        }, StatusCodes.METHOD_NOT_ALLOWED);
    });