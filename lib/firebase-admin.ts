import {
  getApps,
  initializeApp,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
export const adminApp = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential:
        privateKey && clientEmail
          ? cert({ projectId, clientEmail, privateKey })
          : applicationDefault(),
    });
export const adminAuth = getAuth(adminApp);

export const adminDb = getFirestore();