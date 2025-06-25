import { createError, ErrorType } from "@/lib/utils/error-handler"

export const generateToken = async (payload: any, secret: string, expiresIn: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, { expiresIn }, (err, token) => {
      if (err) {
        reject(createError(ErrorType.JWT_ERROR, "Failed to generate token"))
      }
      if (token) {
        resolve(token)
      }
    })
  })
}

export const verifyToken = async (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(createError(ErrorType.JWT_ERROR, "Failed to verify token"))
      }
      resolve(decoded)
    })
  })
}

import jwt from "jsonwebtoken"
