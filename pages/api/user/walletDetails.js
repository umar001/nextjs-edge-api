import { getToken } from "next-auth/jwt"
import prisma from "../../../lib/prisma"
import { StatusCodes } from "http-status-codes"


export default async function handler(req, res) {
    try {
        const token = await getToken({ req })
        if (token) {
            if (req.method === 'GET') {
                const { walletAddress } = req.query
                const wallet = await prisma.userWallet.findUnique({
                    where: {
                        walletAddress
                    }
                })
                return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, wallet });
            }
            if (req.method === 'POST') {
                const { walletAddress, tokenAddress, balance, web3Provider } = req.body
                const wallet = await prisma.userWallet.upsert({
                    where: {
                        walletAddress
                    },
                    update: {
                        tokenAddress,
                        balance,
                        web3Provider,
                    },
                    create: {
                        walletAddress,
                        tokenAddress,
                        balance,
                        web3Provider,
                        userId: token?.user?.id
                    }
                })
                return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, wallet });
            }
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: "Not signed in" })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'failed to load data' })
    }

}