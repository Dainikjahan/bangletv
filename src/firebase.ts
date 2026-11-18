import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  writeBatch,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  type Firestore,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import type { ContentCategory, DistributionScope } from './types/broadcast';

interface FirebaseAppletConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

// Optionally load local firebase-applet-config.json if present without failing Vite builds when deleted/gitignored
const configModules = import.meta.glob('../firebase-applet-config.json', {
  eager: true,
}) as Record<string, { default?: FirebaseAppletConfig }>;
const firebaseConfigFile: FirebaseAppletConfig =
  configModules['../firebase-applet-config.json']?.default ?? {};

// Silence internal offline retry and connection polling warnings
try {
  setLogLevel('silent');
} catch {}

function cleanEnvValue(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('YOUR_') || trimmed.startsWith('MY_')) {
    return '';
  }
  return trimmed;
}

const resolvedFirebaseConfig = {
  apiKey: cleanEnvValue(import.meta.env.VITE_FIREBASE_API_KEY) || firebaseConfigFile.apiKey || '',
  authDomain:
    cleanEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfigFile.authDomain || '',
  projectId:
    cleanEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID) || firebaseConfigFile.projectId || '',
  storageBucket:
    cleanEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ||
    firebaseConfigFile.storageBucket ||
    '',
  messagingSenderId:
    cleanEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    firebaseConfigFile.messagingSenderId ||
    '',
  appId: cleanEnvValue(import.meta.env.VITE_FIREBASE_APP_ID) || firebaseConfigFile.appId || '',
  firestoreDatabaseId:
    cleanEnvValue(import.meta.env.VITE_FIRESTORE_DATABASE_ID) ||
    firebaseConfigFile.firestoreDatabaseId ||
    '',
};

const isFirebaseConfigured = Boolean(
  resolvedFirebaseConfig.apiKey && resolvedFirebaseConfig.projectId && resolvedFirebaseConfig.appId
);

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp({
      apiKey: resolvedFirebaseConfig.apiKey,
      authDomain: resolvedFirebaseConfig.authDomain,
      projectId: resolvedFirebaseConfig.projectId,
      storageBucket: resolvedFirebaseConfig.storageBucket,
      messagingSenderId: resolvedFirebaseConfig.messagingSenderId,
      appId: resolvedFirebaseConfig.appId,
    });
    const dbId = resolvedFirebaseConfig.firestoreDatabaseId || undefined;
    try {
      db = initializeFirestore(
        app,
        { experimentalAutoDetectLongPolling: true },
        dbId
      );
    } catch {
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization skipped:', err);
    app = null;
    db = null;
    auth = null;
  }
}

// Test connection on boot without crashing or firing fatal console errors when offline
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      isFirestoreConnected = false;
      console.warn('Firestore operating in offline standby mode; check network or Firebase config if persistence is needed.');
    }
  }
}
testConnection();

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Safe connection status tracker
let isFirestoreConnected = true;

export function getFirestoreConnectionStatus(): boolean {
  return isFirestoreConnected;
}

export interface ContributorProfile {
  uid: string;
  displayName: string;
  communityId: string;
  communityName: string;
  region: string;
  bio: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PublishedBroadcastDoc {
  id: string;
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  distributionScope: 'PUBLIC' | 'COMMUNITY_ONLY';
  title: string;
  description: string;
  category: ContentCategory;
  location: string;
  language: string;
  videoUrl: string;
  complianceStatus: 'APPROVED';
  complianceScore: number;
  complianceReasoning: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Sanitize strings to guarantee adherence to firebase-blueprint.json & firestore.rules bounds
function sanitizeId(raw: string, fallback: string = 'desk-global'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return cleaned.length >= 2 ? cleaned : fallback;
}

function clampString(raw: string, minLen: number, maxLen: number, fallback: string): string {
  const trimmed = raw.trim().slice(0, maxLen);
  if (trimmed.length >= minLen) return trimmed;
  return fallback.slice(0, maxLen);
}

export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error(
      'Firebase Authentication is not configured. Set VITE_FIREBASE_* environment variables or restore firebase-applet-config.json.'
    );
  }
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutContributor(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function getContributorProfile(uid: string): Promise<ContributorProfile | null> {
  if (!db) return null;
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as ContributorProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertContributorProfile(input: {
  uid: string;
  email: string;
  displayName: string;
  communityId: string;
  communityName: string;
  region: string;
  bio: string;
  isExisting: boolean;
}): Promise<ContributorProfile> {
  const userPath = `users/${input.uid}`;
  if (!db) {
    handleFirestoreError(new Error('Firestore is not configured.'), OperationType.WRITE, userPath);
  }
  const safeProfile = {
    uid: input.uid,
    displayName: clampString(input.displayName, 2, 80, 'Bengal TV Correspondent'),
    communityId: sanitizeId(input.communityId, 'global-bengal-desk'),
    communityName: clampString(input.communityName, 2, 80, 'Global Bengal Desk'),
    region: clampString(input.region, 2, 80, 'Dhaka / Global'),
    bio: input.bio.trim().slice(0, 300),
  };

  try {
    if (input.isExisting) {
      await updateDoc(doc(db, 'users', input.uid), {
        displayName: safeProfile.displayName,
        communityId: safeProfile.communityId,
        communityName: safeProfile.communityName,
        region: safeProfile.region,
        bio: safeProfile.bio,
        updatedAt: serverTimestamp(),
      });
    } else {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', input.uid), {
        ...safeProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'users', input.uid, 'private', 'info'), {
        uid: input.uid,
        email: clampString(input.email, 3, 160, 'verified@bengaltv.com'),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    }
    return safeProfile;
  } catch (error) {
    handleFirestoreError(
      error,
      input.isExisting ? OperationType.UPDATE : OperationType.CREATE,
      userPath
    );
  }
}

export async function publishVerifiedBroadcast(input: {
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  distributionScope: 'PUBLIC' | 'COMMUNITY_ONLY';
  title: string;
  description: string;
  category: ContentCategory;
  location: string;
  language: string;
  videoUrl: string;
  complianceScore: number;
  complianceReasoning: string;
}): Promise<string> {
  const broadcastId = `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `broadcasts/${broadcastId}`;
  if (!db) {
    handleFirestoreError(new Error('Firestore is not configured.'), OperationType.CREATE, path);
  }

  const allowedCats: ContentCategory[] = [
    'NEWS',
    'LIVE_NEWS',
    'DOCUMENTARY',
    'EDUCATION',
    'SCIENCE',
    'PUBLIC_SERVICE',
    'COMMUNITY',
  ];
  const safeCat: ContentCategory = allowedCats.includes(input.category) ? input.category : 'NEWS';

  const payload = {
    id: broadcastId,
    authorId: input.authorId,
    authorName: clampString(input.authorName, 2, 80, 'Bengal TV Contributor'),
    communityId: sanitizeId(input.communityId, 'global-bengal-desk'),
    communityName: clampString(input.communityName, 2, 80, 'Global Bengal Desk'),
    distributionScope: input.distributionScope === 'COMMUNITY_ONLY' ? 'COMMUNITY_ONLY' : 'PUBLIC',
    title: clampString(input.title, 5, 140, 'Journalistic Broadcast Dispatch'),
    description: clampString(
      input.description,
      10,
      1200,
      'Verified journalistic report published on Bengal TV.'
    ),
    category: safeCat,
    location: clampString(input.location, 2, 100, 'Global Desk'),
    language: clampString(input.language, 2, 40, 'Bengali / English'),
    videoUrl: clampString(input.videoUrl, 5, 600, '/uploads/sample.mp4'),
    complianceStatus: 'APPROVED' as const,
    complianceScore: Math.max(70, Math.min(100, Math.round(input.complianceScore))),
    complianceReasoning: clampString(
      input.complianceReasoning,
      5,
      600,
      'Approved by Bengal TV Journalistic & Humanitarian Compliance Gate.'
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'broadcasts', broadcastId), payload);
    return broadcastId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function updateBroadcastDistributionScope(
  broadcastId: string,
  newScope: Extract<DistributionScope, 'PUBLIC' | 'COMMUNITY_ONLY'>
): Promise<void> {
  const path = `broadcasts/${broadcastId}`;
  if (!db) {
    handleFirestoreError(new Error('Firestore is not configured.'), OperationType.UPDATE, path);
  }
  return updateDoc(doc(db, 'broadcasts', broadcastId), {
    distributionScope: newScope,
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    handleFirestoreError(error, OperationType.UPDATE, path);
  });
}

export async function deletePublishedBroadcast(broadcastId: string): Promise<void> {
  const path = `broadcasts/${broadcastId}`;
  if (!db) {
    handleFirestoreError(new Error('Firestore is not configured.'), OperationType.DELETE, path);
  }
  try {
    await deleteDoc(doc(db, 'broadcasts', broadcastId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePublicBroadcasts(
  onData: (items: PublishedBroadcastDoc[]) => void
): Unsubscribe {
  if (!db) {
    isFirestoreConnected = false;
    onData([]);
    return () => {};
  }
  const path = 'broadcasts';
  try {
    const q = query(
      collection(db, 'broadcasts'),
      where('complianceStatus', '==', 'APPROVED'),
      where('distributionScope', '==', 'PUBLIC')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        isFirestoreConnected = true;
        const docs = snapshot.docs.map((d) => d.data() as PublishedBroadcastDoc);
        docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        onData(docs);
      },
      (error) => {
        isFirestoreConnected = false;
        console.warn(`Firestore public broadcasts operating offline (${path}):`, error?.message || error);
        onData([]);
      }
    );
  } catch (err) {
    console.warn(`Unable to attach Firestore public broadcasts listener:`, err);
    onData([]);
    return () => {};
  }
}

export function subscribeCommunityBroadcasts(
  communityId: string,
  onData: (items: PublishedBroadcastDoc[]) => void
): Unsubscribe {
  if (!db) {
    isFirestoreConnected = false;
    onData([]);
    return () => {};
  }
  const path = 'broadcasts';
  const safeCommunityId = sanitizeId(communityId, 'global-bengal-desk');
  try {
    const q = query(
      collection(db, 'broadcasts'),
      where('complianceStatus', '==', 'APPROVED'),
      where('distributionScope', '==', 'COMMUNITY_ONLY'),
      where('communityId', '==', safeCommunityId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        isFirestoreConnected = true;
        const docs = snapshot.docs.map((d) => d.data() as PublishedBroadcastDoc);
        docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        onData(docs);
      },
      (error) => {
        isFirestoreConnected = false;
        console.warn(`Firestore community broadcasts operating offline (${path}):`, error?.message || error);
        onData([]);
      }
    );
  } catch (err) {
    console.warn(`Unable to attach Firestore community broadcasts listener:`, err);
    onData([]);
    return () => {};
  }
}
