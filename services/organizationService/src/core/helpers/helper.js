import jwt from 'jsonwebtoken';
import { appConfig } from '#config/app.config.js';
import { firebaseAdmin } from '#config/firebase.config.js';
import { logger } from '#utils/logger.js';

const generateTokens = (email, userId, orgId, type) => {
    try {
        if(type === "refresh"){
        const refreshToken = jwt.sign({
            email,
            userId,
            orgId
        }, appConfig.jwt.refreshTokenSecret, {
            expiresIn: appConfig.jwt.refreshTokenExpiry
        })

        if(!refreshToken){
           throw error;
        }
        return {"refreshToken":refreshToken};
    }else if(type === "access"){  

        const accessToken = jwt.sign({
            email,
            userId,
            orgId
        }, appConfig.jwt.accessTokenSecret, {
            expiresIn: appConfig.jwt.accessTokenExpiry
        })

        if(!accessToken){
            throw error;
        }
        return {"accessToken":accessToken};
    }else if(type === "both"){
         const refreshToken = jwt.sign({
            email,
            userId,
            orgId
        }, appConfig.jwt.refreshTokenSecret, {
            expiresIn: appConfig.jwt.refreshTokenExpiry
        })
         const accessToken = jwt.sign({
            email,
            userId,
            orgId
        }, appConfig.jwt.accessTokenSecret, {
            expiresIn: appConfig.jwt.accessTokenExpiry
        })

        return {"accessToken":accessToken, "refreshToken":refreshToken}
    }
    } catch (error) {
        throw error;
    }
}   

const regenrateAccessToken = (refreshToken, email, userId, orgId) =>{
    try {
        const decoded = jwt.verify(refreshToken, appConfig.jwt.refreshTokenSecret);
        if(decoded.email !== email || decoded.userId !== userId || decoded.orgId !== orgId){
            throw error;
        }
        const accessToken = generateTokens({email, userId, orgId, type: 'access'});
        return accessToken;
    } catch (error) {
        throw error;
    }
}

const excludeKeyFromObject = (object, keys) => {
    const filteredObject = {};
    for (const key in object) {
        if (!keys.includes(key)) {
            filteredObject[key] = object[key];
        }
    }
    return filteredObject;
}

const checkTokenExpiry = (token, type) => {
    try {
        if(type==="refresh"){
            const decoded = jwt.verify(token, appConfig.jwt.refreshTokenSecret);
            console.log(decoded);   
            if(!decoded){
                throw error;
            }
            const expiryDate = decoded.exp * 1000;
            const currentDate = Date.now();
            return expiryDate < currentDate;
        }else{
            const decoded = jwt.verify(token, appConfig.jwt.accessTokenSecret);
            if(!decoded){
                throw error;
            }
            const expiryDate = decoded.exp * 1000;
            const currentDate = Date.now();
            return expiryDate < currentDate;
        }
    } catch (error) {
        return false;
    }
}

const generateResetPasswordToken = (email, userId, orgId) =>{
    try {
        const resetPasswordToken = jwt.sign({
            email,
            userId,
            orgId
        }, appConfig.jwt.resetPasswordTokenSecret, {
            expiresIn: appConfig.jwt.resetPasswordTokenExpiry
        })
        if(!resetPasswordToken){
            throw error;
        }
        return {"resetPasswordToken":resetPasswordToken};
    } catch (error) {
        throw error;
    }
}

const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

/**
 * Utility: Verify Firebase ID Token
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    return await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (error) {
    logger.error("❌ Firebase token verification failed:", {
      error: error.message,
    });
    throw error;
  }
};


export {
    generateTokens,
    regenrateAccessToken,
    excludeKeyFromObject,
    checkTokenExpiry,
    generateResetPasswordToken,
    generateOTP,
    verifyFirebaseToken
}