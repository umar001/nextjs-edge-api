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
        check('coins').notEmpty().withMessage('coins is empty'),
        check('coins').isInt().withMessage('coins invalid value'),
        check('gems').notEmpty().withMessage('gems is empty'),
        check('gems').isInt().withMessage('gems invalid value'),
        check('gameStatus').notEmpty().withMessage('gameStatus is empty'),
        check('gameStatus').isString().withMessage('gameStatus invalid value'),

        // all other validation 
    ]
)

// define my middleware here and use it only for POST requests
export default handler.use(post(validator)).use(checkAuth)
    .get(async (req, res) => {
        try {
            const user = getUserFromToken(req)
            const walletRewards = await prisma.adminWalletRewards.findMany({
                select: {
                    id: true,
                    level: true,
                    coins: true,
                    gems: true,
                    gameStatus: true,
                }
            })
            return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, walletRewards })

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
            const { level, coins, gems, gameStatus } = req.body
            let walletRewards = await prisma.adminWalletRewards.findFirst({
                where: { level, gameStatus }
            })
            if (walletRewards) {
                return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: `Level ${level} with gameStatus ${gameStatus} is already exists.` })
            }
            walletRewards = await prisma.adminWalletRewards.create({
                data: {
                    level,
                    coins,
                    gems,
                    gameStatus,
                    userId: user._id
                },
                select: {
                    id: true,
                    level: true,
                    coins: true,
                    gems: true,
                    gameStatus: true,
                }
            })
            return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, walletRewards })

        } catch (error) {
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