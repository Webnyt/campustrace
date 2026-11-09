import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import { LostFoundItem, UserProfile } from '../types';
import { INITIAL_ITEMS } from '../data/mockData';

const ITEMS_COLLECTION = 'items';

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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Contextual Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function subscribeToFirestoreItems(
  onUpdate: (items: LostFoundItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, ITEMS_COLLECTION);
    // Attempt sorted query, fallback to plain collection reference if index is pending
    const q = query(colRef, orderBy('date_posted', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            await seedFirestoreIfEmpty();
            return;
          } catch (seedErr) {
            console.warn('Could not auto-seed empty items collection:', seedErr);
          }
        }

        const items: LostFoundItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            item_id: data.item_id || d.id,
            category_id: data.category_id || 1,
            category_name: data.category_name || 'General',
            item_name: data.item_name || 'Untitled Item',
            description: data.description || '',
            location_found: data.location_found || '',
            finder_contact: data.finder_contact || '',
            finder_name: data.finder_name || 'Campus Citizen',
            finder_id: data.finder_id,
            image_path: data.image_path || null,
            item_status: data.item_status || 'Unclaimed',
            item_type: data.item_type || 'found',
            dropoff_location: data.dropoff_location,
            claimed_by: data.claimed_by,
            claimed_date: data.claimed_date,
            claim_notes: data.claim_notes,
            date_posted: data.date_posted || new Date().toISOString(),
            map_grounding: data.map_grounding || null,
          } as LostFoundItem;
        });

        onUpdate(items);
      },
      (err) => {
        console.warn('Firestore real-time subscription fallback activated:', err.message);
        if (onError) {
          onError(err);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn('Could not attach Firestore onSnapshot listener:', err.message);
    if (onError) onError(err);
    return () => {};
  }
}

export async function seedFirestoreIfEmpty() {
  const colRef = collection(db, ITEMS_COLLECTION);
  let snap;
  try {
    snap = await getDocs(colRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ITEMS_COLLECTION);
  }

  if (!snap.empty) return;

  for (const item of INITIAL_ITEMS) {
    const docId = `item_${item.item_id}`;
    const docRef = doc(db, ITEMS_COLLECTION, docId);
    try {
      await setDoc(docRef, {
        ...item,
        created_at: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ITEMS_COLLECTION}/${docId}`);
    }
  }
}

export async function addFirestoreLostFoundItem(
  item: Partial<LostFoundItem>,
  user?: UserProfile | null
): Promise<LostFoundItem> {
  const newItemId = Date.now();
  const docId = `item_${newItemId}`;
  const docRef = doc(db, ITEMS_COLLECTION, docId);

  const fullItem: LostFoundItem = {
    id: docId,
    item_id: newItemId,
    category_id: item.category_id || 1,
    category_name: item.category_name || 'Electronics',
    item_name: item.item_name || 'Unnamed Item',
    description: item.description || '',
    location_found: item.location_found || '',
    finder_contact: item.finder_contact || '',
    finder_name: user?.displayName || item.finder_name || 'Campus Student',
    finder_id: user?.uid,
    image_path: item.image_path || null,
    item_status: 'Unclaimed',
    item_type: item.item_type || 'found',
    dropoff_location: item.dropoff_location || 'Campus Desk',
    date_posted: new Date().toISOString(),
    map_grounding: item.map_grounding || null,
  };

  try {
    await setDoc(docRef, {
      ...fullItem,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ITEMS_COLLECTION}/${docId}`);
  }

  return fullItem;
}

export async function updateFirestoreClaim(
  item: LostFoundItem,
  payload: { claimed_by: string; claim_notes: string }
): Promise<LostFoundItem> {
  const docId = item.id || `item_${item.item_id}`;
  const docRef = doc(db, ITEMS_COLLECTION, docId);

  const updatedFields = {
    item_status: 'Claimed',
    claimed_by: payload.claimed_by,
    claim_notes: payload.claim_notes,
    claimed_date: new Date().toISOString(),
  };

  try {
    await updateDoc(docRef, updatedFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ITEMS_COLLECTION}/${docId}`);
  }

  return {
    ...item,
    item_status: 'Claimed',
    claimed_by: payload.claimed_by,
    claim_notes: payload.claim_notes,
    claimed_date: updatedFields.claimed_date,
  };
}

export async function unclaimFirestoreLostFoundItem(
  item: LostFoundItem
): Promise<LostFoundItem> {
  const docId = item.id || `item_${item.item_id}`;
  const docRef = doc(db, ITEMS_COLLECTION, docId);

  const updatedFields = {
    item_status: 'Unclaimed',
    claimed_by: '',
    claim_notes: '',
    claimed_date: '',
  };

  try {
    await updateDoc(docRef, updatedFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ITEMS_COLLECTION}/${docId}`);
  }

  return {
    ...item,
    item_status: 'Unclaimed',
    claimed_by: undefined,
    claim_notes: undefined,
    claimed_date: undefined,
  };
}

export async function deleteFirestoreLostFoundItem(item: LostFoundItem): Promise<void> {
  const docId = item.id || `item_${item.item_id}`;
  const docRef = doc(db, ITEMS_COLLECTION, docId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ITEMS_COLLECTION}/${docId}`);
  }
}
