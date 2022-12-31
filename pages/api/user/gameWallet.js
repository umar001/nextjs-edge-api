import { getToken } from "next-auth/jwt"
import prisma from "../../../lib/prisma"
import { StatusCodes } from "http-status-codes"


export default async function handler(req, res) {
    try {
        const token = await getToken({ req })
        if (token) {
            if (req.method === 'GET') {
                let gameWallet = await prisma.userGameWallet.findFirst({
                    where: {
                        userId: token?.user?.id
                    },
                    select: {
                        coins: true,
                        gems: true
                    }
                })
                if (!gameWallet) {
                    gameWallet = await prisma.userGameWallet.create({
                        data: {
                            userId: token?.user?.id
                        },
                        select: {
                            coins: true,
                            gems: true
                        }
                    })
                }
                return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, gameWallet });
            }
            if (req.method === 'POST') {
                const { coins, gems } = req.body
                const gameWallet = await prisma.userWallet.update({
                    where: {
                        userId: token?.user?.id
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
                return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, gameWallet });
            }
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: "Not signed in" })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'failed to load data' })
    }

}