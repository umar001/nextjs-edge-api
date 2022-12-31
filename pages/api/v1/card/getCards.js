import { StatusCodes } from "http-status-codes";
import { checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import nc from 'next-connect';

const handler = nc({ onError })
// define my middleware here and use it only for POST requests
export default handler.use(checkAuth)
    .get(async (req, res) => {
        const card = await prisma.card.findMany({
            where: { status: true },
            select: {
                name: true,
                status: true,
                id: true,
                attackRange: true,
                attackWait: true,
                elixirUsage: true,
                level: true,
                damage: true,
                health: true,
                createdAt: true,
                updatedAt: true
            }
        })
        return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, card })
    })
    .all((req, res) => {
        res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
            status: StatusCodes.METHOD_NOT_ALLOWED,
            error: "Method not allowed",
        });
    });