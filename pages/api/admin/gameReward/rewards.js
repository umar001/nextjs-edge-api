import { StatusCodes } from "http-status-codes";
import { initValidation, post, check, checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';

const handler = nc({ onError })
const validator = initValidation(
    [
        check('level').notEmpty().withMessage('level is empty'),
        check('level').isInt().withMessage('level invalid value'),
        check('xpMax').notEmpty().withMessage('xpMax is empty'),
        check('xpMax').isInt().withMessage('xpMax invalid value'),
        check('xpMin').notEmpty().withMessage('xpMin is empty'),
        check('xpMin').isInt().withMessage('xpMin invalid value'),

        // all other validation 
    ]
)

// define my middleware here and use it only for POST requests
export default handler.use(post(validator)).use(checkAuth)
    .get(async (req, res) => {
        try {
            const rewards = await prisma.adminRewards.findMany({
                select: {
                    id: true,
                    level: true,
                    xpMin: true,
                    xpMax: true
                }
            })
            return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, rewards })

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: `Duplication found in ${error?.meta?.target}` })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data' })
        }
    })
    .post(async (req, res) => {
        try {
            const user = getUserFromToken(req)
            const { level, xpMin, xpMax } = req.body
            let rewards = await prisma.adminRewards.findFirst({
                where: { level }
            })
            if (rewards) {
                return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: `Level ${level} with game min xp ${rewards.xpMin} and max xp ${rewards.xpMax} is already exists.` })
            }
            rewards = await prisma.adminRewards.create({
                data: {
                    level,
                    xpMax,
                    xpMin,
                    userId: user._id
                },
                select: {
                    id: true,
                    level: true,
                    xpMin: true,
                    xpMax: true,
                }
            })
            return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, rewards })

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: `Duplication found in ${error?.meta?.target}` })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data' })
        }

    })
    .all((req, res) => {
        res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
            status: StatusCodes.METHOD_NOT_ALLOWED,
            error: "Method not allowed",
        });
    });