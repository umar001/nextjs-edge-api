import { StatusCodes } from "http-status-codes";
import { initValidation, post, check, checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';
import returnResponse from "../../../../utils/returnResponse";

const handler = nc({ onError })
const validator = initValidation(
    [
        check('xp').notEmpty().withMessage('exp is empty'),
        check('xp').isInt().withMessage('exp invalid value'),

        // all other validation 
    ]
)
export const config = {
    runtime: 'edge',
}
// define my middleware here and use it only for POST requests
export default handler.use(post(validator)).use(checkAuth)
    .get(async (req) => {
        try {
            const user = getUserFromToken(req)
            let score = await prisma.score.findFirst({
                where: {
                    userId: user._id
                }
            })
            if (!score) {
                await prisma.score.create({
                    data: {
                        userId: user._id
                    }
                })
            }
            score = await prisma.score.findFirst({
                where: {
                    userId: user._id
                },
                select: {
                    level: true,
                    xp: true
                }
            })
            return returnResponse({ status: StatusCodes.OK, data: { score }, message: "User score details" }, StatusCodes.OK)

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: `Duplication found in ${error?.meta?.target}`, data: {} }, StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: 'failed to load data', data: {} }, StatusCodes.INTERNAL_SERVER_ERROR)
        }
    })
    .post(async (req) => {
        try {
            const user = getUserFromToken(req)
            const { xp } = req.body
            console.log(user)
            const userScore = await prisma.score.findFirst({
                where: { userId: user._id }
            })
            let userXp = 0
            if (userScore) {
                userXp = userScore.xp
            }
            console.log(userXp)
            userXp = parseFloat(userXp) + xp
            const rewards = await prisma.adminRewards.findFirst({
                where: { xpMin: { lte: userXp }, xpMax: { gte: userXp } }
            })
            if (!rewards) {
                return returnResponse({ status: StatusCodes.BAD_REQUEST, message: `User Level not found against this score ${userXp} `, data: {} }, StatusCodes.BAD_REQUEST)
            }
            if (!userScore) {
                const score = await prisma.score.create({
                    data: {
                        level: rewards.level,
                        xp: userXp,
                        userId: user._id
                    },
                    select: {
                        level: true,
                        xp: true
                    }
                })
                return returnResponse({ status: StatusCodes.OK, data: { score }, message: "User Score retreived" }, StatusCodes.OK)
            } else {
                const score = await prisma.score.update({
                    where: {
                        id: userScore.id
                    },
                    data: {
                        level: rewards.level,
                        xp: userXp
                    },
                    select: {
                        level: true,
                        xp: true
                    }
                })
                return returnResponse({ status: StatusCodes.OK, data: { score }, message: "User Score retreived" }, StatusCodes.OK)
            }

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
            message: "Method not allowed"
        }, StatusCodes.METHOD_NOT_ALLOWED);
    });