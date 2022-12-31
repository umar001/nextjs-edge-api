import { StatusCodes } from "http-status-codes";
import { initValidation, post, check, checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';
import returnResponse from "../../../../utils/returnResponse";

const handler = nc({ onError })
const validator = initValidation(
    [
        check('win').notEmpty().withMessage('win is empty'),
        check('win').isBoolean().withMessage('coins invalid value'),

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
    .get(async (req, res) => {
        try {
            const user = getUserFromToken(req)
            let wallet = await prisma.userGameWallet.findFirst({
                where: {
                    userId: user._id
                }
            })
            if (!wallet) {
                await prisma.userGameWallet.create({
                    data: {
                        userId: user._id
                    }
                })
            }
            wallet = await prisma.userGameWallet.findFirst({
                where: {
                    userId: user._id
                },
                select: {
                    coins: true,
                    gems: true
                }
            })
            return returnResponse({ status: StatusCodes.OK, data: { wallet }, message: "User Game Wallet details successfully retrieved" }, StatusCodes.OK)

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: `Duplication found in ${error?.meta?.target}` }, StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: 'failed to load data' }, StatusCodes.INTERNAL_SERVER_ERROR)
        }
    })
    .post(async (req, res) => {
        try {
            const user = getUserFromToken(req)
            const { win } = req.body
            const userScore = await prisma.score.findFirst({
                where: { userId: user._id }
            })
            if (!userScore) {
                return returnResponse({ status: StatusCodes.BAD_REQUEST, data: {}, message: `User Level not found` }, StatusCodes.BAD_REQUEST)
            }
            let wallet = await prisma.userGameWallet.findFirst({
                where: { userId: user._id }
            })
            if (!wallet) {
                wallet = await initUserWalletScore(user)
            }
            const gameStatus = win ? "win" : "lose"
            const adminWalletRewards = await prisma.adminWalletRewards.findFirst({
                where: { level: userScore.level, gameStatus }
            })

            if (!adminWalletRewards) {
                return returnResponse({ status: StatusCodes.BAD_REQUEST, data: {}, message: `Wallet Rewards details not added by the admin against this user level ${userScore.level}` }, StatusCodes.BAD_REQUEST)
            }

            const coins = parseFloat(wallet.coins) + adminWalletRewards.coins
            const gems = parseFloat(wallet.gems) + adminWalletRewards.gems
            const userWallet = await prisma.userGameWallet.update({
                where: {
                    id: wallet.id
                },
                data: {
                    coins,
                    gems
                },
                select: {
                    coins: true,
                    gems: true
                }
            })
            return returnResponse({ status: StatusCodes.OK, data: { userWallet, gameReward: { coins: adminWalletRewards.coins, gems: adminWalletRewards.gems } }, message: "User Game Wallet details successfully retrieved" }, StatusCodes.OK)

        } catch (error) {
            console.log(error)
            if (error?.code === "P2002") {
                return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: `Duplication found in ${error?.meta?.target}` }, StatusCodes.INTERNAL_SERVER_ERROR)
            }
            return returnResponse({ status: StatusCodes.INTERNAL_SERVER_ERROR, data: {}, message: 'failed to load data' }, StatusCodes.INTERNAL_SERVER_ERROR)
        }

    })
    .all((req, res) => {
        return returnResponse({
            status: StatusCodes.METHOD_NOT_ALLOWED,
            data: {},
            message: "Method not allowed",
        }, StatusCodes.METHOD_NOT_ALLOWED);
    });


const initUserWalletScore = async (user) => {
    return await prisma.userGameWallet.create({
        data: {
            userId: user._id,
        }
    })
}