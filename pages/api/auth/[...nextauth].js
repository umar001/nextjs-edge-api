import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
// import prisma from "../../../lib/prisma"
import { verifyPassword } from "../../../lib/auth";
import { PrismaClient } from '@prisma/client';
import { randomNum } from "../../../utils/helper";
import { sendEmailVerification } from "../../../lib/mail/mail";
const prisma = new PrismaClient();


export const authOptions = {
    // Configure one or more authentication providers
    providers: [
        CredentialsProvider({
            // The name to display on the sign in form (e.g. "Sign in with...")
            name: "Credentials",
            // `credentials` is used to generate a form on the sign in page.
            // You can specify which fields should be submitted, by adding keys to the `credentials` object.
            // e.g. domain, username, password, 2FA token, etc.
            // You can pass any HTML attribute to the <input> tag through the object.
            credentials: {
                email: { label: "Email", type: "email", },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                try {
                    const { email, password } = req.body
                    console.log(email, password)
                    const user = await prisma.user.findUnique({
                        where: {
                            email
                        }
                    })
                    const wrongAttempts = await prisma.loginAttempts.findMany({
                        where: {
                            email
                        }
                    })
                    if (!user.emailVerified) {
                        const random = randomNum()
                        // await prisma.emailVerification.
                        await emailVerificationCreateOrUpdate(user, random)
                        await sendEmailVerification(email, random)
                        return Promise.reject(new Error("NOT_VERIFIED"))
                    }
                    if (wrongAttempts.length > 15) {
                        return Promise.reject(new Error("Too many wrong password attempts. Please reset your password."))
                    }
                    if (!user) {
                        return Promise.reject(new Error("This email address is not exists"))
                    }
                    const verify = await verifyPassword(password, user.password)
                    if (verify) {
                        let user = await prisma.user.findUnique({
                            where: {
                                email: email
                            },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                emailVerified: true,
                                image: true,
                                username: true
                            }
                        })
                        // Any object returned will be saved in `user` property of the JWT
                        return user
                    } else {

                        if (wrongAttempts.length > 15) {
                            return Promise.reject(new Error("Too many wrong password attempts. Please reset your password."))
                        } else {
                            await prisma.loginAttempts.create({
                                data: {
                                    email
                                }
                            })
                        }
                        // If you return null then an error will be displayed advising the user to check their details.
                        return Promise.reject(new Error("Invalid Email or Password"))

                        // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
                    }

                } catch (error) {
                    console.log(error)
                }
            }
        })
        // ...add more providers here
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        jwt: async ({ token, user }) => {
            user && (token.user = user);
            return token;
        },
        session: async ({ session, token }) => {
            session.user = token.user;  // Setting token in session
            return session;
        },
    },
    // callbacks: {
    //     async jwt({ token, account }) {
    //         // Persist the OAuth access_token to the token right after signin
    //         if (account) {
    //             token.accessToken = account.access_token
    //         }
    //         return token
    //     },
    //     async session({ session, token, user }) {
    //         // Send properties to the client, like an access_token from a provider.
    //         session.accessToken = token.accessToken
    //         return session
    //     }
    // },
    // jwt: {
    //     // The maximum age of the NextAuth.js issued JWT in seconds.
    //     // Defaults to `session.maxAge`.
    //     maxAge: 60 * 60 * 24 * 30,
    //     // You can define your own encode/decode functions for signing and encryption
    //     async encode() { },
    //     async decode() { },
    // },
    session: {
        jwt: true,
        maxAge: 30 * 24 * 60 * 60 // the session will last 30 days
    },
    debug: true,
    pages: {
        signIn: '/auth/login',
    }
}
export default NextAuth(authOptions)

const emailVerificationCreateOrUpdate = async (user, random) => {
    const verify = await prisma.emailVerification.findFirst({
        where: {
            userId: user.id
        }
    })
    console.log(verify)
    if (verify) {
        await prisma.emailVerification.update({
            where: {
                id: verify.id
            },
            data: {
                code: random
            }
        })
    } else {
        await prisma.emailVerification.create({
            data: {
                userId: user.id,
                code: random
            }
        })
    }
    return
}