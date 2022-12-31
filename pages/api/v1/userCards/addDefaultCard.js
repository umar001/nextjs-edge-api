import { StatusCodes } from "http-status-codes";
import { initValidation, post, check, checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';

const handler = nc({ onError })

const validator = initValidation(
    [
        check('name').notEmpty().withMessage('name is empty'),
        check('name').isArray().withMessage('name invalid value'),
        check('name.*').isString().withMessage('Array inside name invalid value'),

        // all other validation 
    ]
)

// define my middleware here and use it only for POST requests
export default handler.use(post(validator)).use(checkAuth)
    .post(async (req, res) => {
        try {
            const user = getUserFromToken(req)
            const { name } = req.body
            if (name.length) {
                try {
                    for (let i = 0; i < name.length; i++) {
                        const card = await prisma.card.findUnique({ where: { name: name[i] } })
                        if (card) {
                            await prisma.defaultCards.create({
                                data: {
                                    cardId: card.id,
                                    userId: user._id,
                                    name: card.name
                                }
                            })
                        } else {
                            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: StatusCodes.INTERNAL_SERVER_ERROR, error: `Card name ${name[i]} not exists` })
                        }
                    }
                } catch (error) {
                    throw error
                }
                const defaultCard = await prisma.defaultCards.findMany({})
                return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, defaultCard })
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong please try again' })


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

