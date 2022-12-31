import { StatusCodes } from "http-status-codes";
import { initValidation, post, check, checkAuth, onError } from "../../../../lib/apiValidationHandler"
import prisma from "../../../../lib/prisma"
import { getUserFromToken } from "../../../../utils/authHelper";
import nc from 'next-connect';

const handler = nc({ onError })

const validator = initValidation(
    [
        check('name').notEmpty().withMessage('name is empty'),
        check('name').isString().withMessage('name invalid value'),
        check('status').notEmpty().withMessage('status is empty'),
        check('status').isBoolean().withMessage('status invalid value'),
        check('price').notEmpty().withMessage('price is empty'),
        check('price').isInt().withMessage('price invalid value'),

        // all other validation 
    ]
)


// define my middleware here and use it only for POST requests
export default handler.use(post(validator)).use(checkAuth)
    .post(async (req, res) => {
        try {
            const user = getUserFromToken(req)

            const { name, status, price } = req.body
            const checkCard = await prisma.card.findUnique({
                where: {
                    name
                }
            })
            if (checkCard) {
                return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: `This Card Name ${name} already exist` })
            }
            let adminCardSpec = await prisma.adminCardSpec.findFirst({})
            if (!adminCardSpec) {
                adminCardSpec = await prisma.adminCardSpec.create({
                    data: { userId: user._id }
                })
            }
            let adminCardLevelSpec = await prisma.adminCardLevelSpec.findFirst({})
            if (!adminCardLevelSpec) {
                adminCardLevelSpec = await prisma.adminCardLevelSpec.create({
                    data: { userId: user._id }
                })
            }
            if (adminCardLevelSpec && adminCardSpec) {
                try {
                    const card = await prisma.card.create({
                        data: {
                            name,
                            status,
                            price,
                            level: adminCardLevelSpec.level,
                            damage: adminCardLevelSpec.damage,
                            health: adminCardLevelSpec.health,
                            attackRange: adminCardSpec.attackRange,
                            attackWait: adminCardSpec.attackWait,
                            elixirUsage: adminCardSpec.elixirUsage
                        }
                    })
                    return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, card })
                } catch (error) {
                    throw error
                }
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong please try again' })


        } catch (error) {
            console.log(error.code)
            if (error?.code === "P2002") {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: `Duplication found in ${error?.meta?.target}` })
            }
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'failed to load data' })
        }
    })
    .all((req, res) => {
        res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
            status: StatusCodes.METHOD_NOT_ALLOWED,
            error: "Method not allowed",
        });
    });