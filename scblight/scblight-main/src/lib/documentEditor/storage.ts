import type {
  DocumentFolder,
  DocumentSaveDestination,
  DocumentSaveScope,
  StoredDocumentMeta,
  UniversalDocument,
} from './types';
import { getPreviewText, uid } from './utils';

const DB_NAME = 'scb_document_editor';
const DB_VERSION = 2;
const STORE_DOCS = 'documents';
const STORE_FOLDERS = 'folders';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
    };
  });
}

function toMeta(d: UniversalDocument): StoredDocumentMeta {
  return {
    id: d.id,
    name: d.name,
    mode: d.mode,
    updatedAt: d.updatedAt,
    preview: getPreviewText(d),
    saveScope: d.saveScope || 'general',
    folderId: d.folderId ?? null,
    clientId: d.clientId ?? null,
    clientName: d.clientName ?? null,
    invoiceId: d.invoiceId ?? null,
    invoiceLabel: d.invoiceLabel ?? null,
  };
}

export async function saveDocumentToApp(
  doc: UniversalDocument,
  destination?: DocumentSaveDestination
): Promise<UniversalDocument> {
  const db = await openDb();
  const updated: UniversalDocument = {
    ...doc,
    ...(destination
      ? {
          saveScope: destination.saveScope,
          folderId: destination.folderId ?? null,
          clientId: destination.clientId ?? null,
          clientName: destination.clientName ?? null,
          invoiceId: destination.invoiceId ?? null,
          invoiceLabel: destination.invoiceLabel ?? null,
        }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  if (!updated.saveScope) updated.saveScope = 'general';

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readwrite');
    tx.objectStore(STORE_DOCS).put(updated);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return updated;
}

export async function loadDocumentFromApp(id: string): Promise<UniversalDocument | null> {
  const db = await openDb();
  const result = await new Promise<UniversalDocument | null>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const req = tx.objectStore(STORE_DOCS).get(id);
    req.onsuccess = () => resolve((req.result as UniversalDocument) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export interface ListDocumentsFilter {
  scope?: DocumentSaveScope | 'all';
  folderId?: string | null;
  clientId?: string | null;
  invoiceId?: string | null;
  unfiledOnly?: boolean;
}

export async function listStoredDocuments(filter?: ListDocumentsFilter): Promise<StoredDocumentMeta[]> {
  const db = await openDb();
  const all = await new Promise<UniversalDocument[]>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const req = tx.objectStore(STORE_DOCS).getAll();
    req.onsuccess = () => resolve((req.result as UniversalDocument[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();

  return all
    .map(toMeta)
    .filter((d) => {
      if (!filter) return true;
      const scope = d.saveScope || 'general';
      if (filter.scope && filter.scope !== 'all' && scope !== filter.scope) return false;
      if (filter.clientId && d.clientId !== filter.clientId) return false;
      if (filter.invoiceId && d.invoiceId !== filter.invoiceId) return false;
      if (filter.unfiledOnly && d.folderId) return false;
      if (filter.folderId !== undefined) {
        if (filter.folderId === null) {
          if (d.folderId) return false;
        } else if (d.folderId !== filter.folderId) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteStoredDocument(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readwrite');
    tx.objectStore(STORE_DOCS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listFolders(filter?: {
  scope?: DocumentSaveScope | 'all';
  clientId?: string | null;
  invoiceId?: string | null;
}): Promise<DocumentFolder[]> {
  const db = await openDb();
  const all = await new Promise<DocumentFolder[]>((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readonly');
    const req = tx.objectStore(STORE_FOLDERS).getAll();
    req.onsuccess = () => resolve((req.result as DocumentFolder[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();

  return all
    .filter((f) => {
      if (!filter) return true;
      if (filter.scope && filter.scope !== 'all' && f.scope !== filter.scope) return false;
      if (filter.clientId && f.clientId !== filter.clientId) return false;
      if (filter.invoiceId && f.invoiceId !== filter.invoiceId) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}

export async function createFolder(input: {
  name: string;
  scope: DocumentSaveScope;
  clientId?: string | null;
  invoiceId?: string | null;
}): Promise<DocumentFolder> {
  const now = new Date().toISOString();
  const folder: DocumentFolder = {
    id: uid(),
    name: input.name.trim(),
    scope: input.scope,
    clientId: input.clientId ?? null,
    invoiceId: input.invoiceId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readwrite');
    tx.objectStore(STORE_FOLDERS).put(folder);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return folder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const db = await openDb();
  const existing = await new Promise<DocumentFolder | null>((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readonly');
    const req = tx.objectStore(STORE_FOLDERS).get(id);
    req.onsuccess = () => resolve((req.result as DocumentFolder) || null);
    req.onerror = () => reject(req.error);
  });
  if (!existing) {
    db.close();
    throw new Error('Папку не знайдено');
  }
  const updated = { ...existing, name: name.trim(), updatedAt: new Date().toISOString() };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readwrite');
    tx.objectStore(STORE_FOLDERS).put(updated);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await openDb();
  // Відв'язати документи від папки (не видаляти файли)
  const docs = await new Promise<UniversalDocument[]>((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const req = tx.objectStore(STORE_DOCS).getAll();
    req.onsuccess = () => resolve((req.result as UniversalDocument[]) || []);
    req.onerror = () => reject(req.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_DOCS, STORE_FOLDERS], 'readwrite');
    const docStore = tx.objectStore(STORE_DOCS);
    docs
      .filter((d) => d.folderId === id)
      .forEach((d) => {
        docStore.put({ ...d, folderId: null, updatedAt: new Date().toISOString() });
      });
    tx.objectStore(STORE_FOLDERS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function scopeLabel(scope?: DocumentSaveScope): string {
  if (scope === 'client') return 'Клієнт';
  if (scope === 'invoice') return 'Інвойс';
  return 'Загальна';
}
