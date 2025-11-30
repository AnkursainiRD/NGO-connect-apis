/**
 * Firebase Admin SDK Configuration
 * ---------------------------------------------------------
 * Initializes Firebase Admin SDK using one of:
 * - Environment variables (recommended)
 * - Application Default Credentials (GCP)
 */

import admin from "firebase-admin";
import { appConfig } from "#config/app.config.js";
import { logger } from "#utils/logger.js";

/**
 * Validate Firebase credentials from configuration
 */
export const validateFirebaseConfig = () => {
  const { projectId, clientEmail, privateKey } = appConfig.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn("⚠️ Firebase credentials are missing. Token verification may fail.");
    return false;
  }

  logger.info("✅ Firebase config loaded successfully");
  return true;
};

// Validate on import (non-blocking)
validateFirebaseConfig();

/**
 * Initialize Firebase Admin SDK safely
 */
const initializeFirebaseAdmin = () => {
  try {
    // 🔥 If already initialized — return existing instance (PREVENTS ERROR)
    if (admin.apps.length > 0) {
      logger.info("Firebase Admin already initialized. Reusing existing instance.");
      return admin.app(); // <-- FIX
    }

    const { projectId, clientEmail, privateKey } = appConfig.firebase;

    // 🔥 Using environment variables (best practice)
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          project_id: projectId,
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, "\n"),
        }),
      });

      logger.info("✅ Firebase Admin initialized using environment variables");
      return admin.app(); // <-- FIX
    }

    // 🔥 Fallback for Google Cloud environments
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });

    logger.info("⚠️ Firebase Admin initialized using Application Default Credentials");
    return admin.app(); // <-- FIX

  } catch (error) {
    logger.error("❌ Firebase Admin initialization failed:", {
      error: error.message,
    });
    throw error;
  }
};

// Initialize once on import
const firebaseAdmin = initializeFirebaseAdmin();

export default firebaseAdmin;
export { firebaseAdmin };
