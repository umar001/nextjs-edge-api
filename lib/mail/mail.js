import nodemailer from "nodemailer";

export const sendEmailVerification = async (receiver, code) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER || 'umar.triixa@gmail.com', // TODO: your gmail account 
            pass: process.env.GMAIL_PASS || 'hfejqjayzgotrcvo' // TODO: your gmail password
        }
    });

    try {
        await transporter.sendMail({
            from: "no-reply@royalbattle.com",
            to: receiver,
            subject: 'Email Verification',
            html: `<h1>Welcome ${process.env.APP_NAME}</h1>
                        <h2>Please verify your mail</h2>
                        <p>Your email code is <strong>${code}</strong></p>`

        });
    } catch (error) {
        return { error: error.message || error.toString() };
    }
    return { error: "" };
};