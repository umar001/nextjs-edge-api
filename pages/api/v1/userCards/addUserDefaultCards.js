import { StatusCodes } from "http-status-codes";
import { checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';

const handler = nc({ onError })
// define my middleware here and use it only for POST requests
export default handler.use(checkAuth)
    .get(async (req, res) => {
        try {
            const user = getUserFromToken(req)
            const defaultCards = await prisma.defaultCards.findMany({})
            if (defaultCards.length) {
                try {
                    for (let i = 0; i < defaultCards.length; i++) {
                        const card = await prisma.card.findFirst({
                            where: {
                                id: defaultCards[i].cardId
                            }
                        })
                        await prisma.userCards.create({
                            data: {
                                name: card.name,
                                status: true,
                                price: card.price,
                                level: card.level,
                                damage: card.damage,
                                health: card.health,
                                userId: user._id,
                                attackRange: card.attackRange,
                                attackWait: card.attackWait,
                                elixirUsage: card.elixirUsage
                            }
                        })
                    }
                } catch (error) {
                    throw error
                }
                return res.status(200).json({ message: "test", defaultCards })
            }
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