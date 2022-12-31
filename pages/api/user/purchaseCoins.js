import { getToken } from "next-auth/jwt"
import prisma from "../../../lib/prisma"
import { StatusCodes } from "http-status-codes"


export default async function handler(req, res) {
    try {
        const token = await getToken({ req })
        if (token) {
            if (req.method !== 'POST') {
                return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: 'This method not supported', status: StatusCodes.METHOD_NOT_ALLOWED });
            }
            if (req.method === 'POST') {
                const { tokenAmount, coins, txHash } = req.body
                const purchaseCoins = await prisma.purchaseGameCoins.create({
                    data: {
                        coins,
                        tokenAmount: parseInt(tokenAmount),
                        txHash,
                        userId: token?.user?.id
                    },
                    select: {
                        coins: true,
                        tokenAmount: true
                    }
                })
                if (purchaseCoins) {
                    const gameWallet = await prisma.userGameWallet.findFirst({
                        where: {
                            userId: token?.user?.id
                        }
                    })
                    const addCoins = parseFloat(gameWallet.coins) + coins
                    const details = await prisma.userGameWallet.update({
                        where: {
                            id: gameWallet.id
                        },
                        data: {
                            coins: addCoins
                        },
                        select: {
                            coins: true,
                            gems: true

                        }

                    })
                    return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, details });
                }
            }
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: "Not signed in" })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'failed to load data' })
    }

}