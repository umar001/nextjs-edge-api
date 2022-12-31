import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.NEXTAUTH_SECRET;


/*
 * @params {payload} extracted from user
 * @return string token of extracted token
 */
export function createJwtToken(payload) {
    try {
        return jwt.sign(payload, SECRET_KEY, {
            expiresIn: 60 * 60 * 24, // 1 year in seconds
        });
    } catch (e) {
        console.log('e:', e);
        return null;
    }
}

/*
 * @params {jwtToken} extracted from cookies
 * @return {object} object of extracted token
 */
export function verifyJwtToken(jwtToken) {
    try {
        return jwt.verify(jwtToken, SECRET_KEY);
    } catch (e) {
        return null;
    }
}

export function getTokenVal(token) {
    return token.replace('Bearer ', '')
}
