import jwt from 'jsonwebtoken';
import { appConfig } from '#config/app.config.js';

const generateTokens = (email, userId, tenantId, type) => {
    try {
        if(type === "refresh"){
        const refreshToken = jwt.sign({
            email,
            userId,
            tenantId
        }, appConfig.jwt.refreshTokenSecret, {
            expiresIn: appConfig.jwt.refreshTokenExpiry
        })

        if(!refreshToken){
           throw error;
        }
        return refreshToken;
    }else if(type === "access"){  

        const accessToken = jwt.sign({
            email,
            userId,
            tenantId
        }, appConfig.jwt.accessTokenSecret, {
            expiresIn: appConfig.jwt.accessTokenExpiry
        })

        if(!accessToken){
            throw error;
        }
        return accessToken;
    }else if(type === "both"){
         const refreshToken = jwt.sign({
            email,
            userId,
            tenantId
        }, appConfig.jwt.refreshTokenSecret, {
            expiresIn: appConfig.jwt.refreshTokenExpiry
        })
         const accessToken = jwt.sign({
            email,
            userId,
            tenantId
        }, appConfig.jwt.accessTokenSecret, {
            expiresIn: appConfig.jwt.accessTokenExpiry
        })

        return {accessToken, refreshToken}
    }
    } catch (error) {
        throw error;
    }
}   

const regenrateAccessToken = (refreshToken, email, userId, tenantId, res) =>{
    try {
        const decoded = jwt.verify(refreshToken, appConfig.jwt.refreshTokenSecret);
        if(decoded.email !== email || decoded.userId !== userId || decoded.tenantId !== tenantId){
            throw error;
        }
        const accessToken = generateTokens({email, userId, tenantId, type: 'access'});
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

export {
    generateTokens,
    regenrateAccessToken,
    excludeKeyFromObject
}