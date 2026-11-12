// ─── Navis IndexedDB Utility ──────────────────────────────────────────────────
const DB_NAME    = "navisDB";
const DB_VERSION = 1;
const STORE_DATA = "invoices";
const STORE_META = "metadata";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA, { keyPath: "idx" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

/** Save invoices array + metadata. Clears old data first. */
export async function saveNavisInvoices(invoices, fetchedAt, columns = []) {
  const db = await openDB();

  // Clear old data
  await new Promise((res, rej) => {
    const tx = db.transaction([STORE_DATA, STORE_META], "readwrite");
    tx.objectStore(STORE_DATA).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = res;
    tx.onerror    = (e) => rej(e.target.error);
  });

  // Write invoices in chunks (better perf for large sets)
  const CHUNK = 200;
  for (let i = 0; i < invoices.length; i += CHUNK) {
    const chunk = invoices.slice(i, i + CHUNK);
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE_DATA, "readwrite");
      const store = tx.objectStore(STORE_DATA);
      chunk.forEach((inv, j) => store.put({ idx: i + j, ...inv }));
      tx.oncomplete = res;
      tx.onerror    = (e) => rej(e.target.error);
    });
  }

  // Write metadata
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE_META, "readwrite");
    const store = tx.objectStore(STORE_META);
    store.put({ key: "meta", fetchedAt, count: invoices.length, columns });
    tx.oncomplete = res;
    tx.onerror    = (e) => rej(e.target.error);
  });

  db.close();
}

/** Get all invoices + metadata from IndexedDB. Returns null if no data. */
export async function getNavisData() {
  const db = await openDB();

  const [invoices, meta] = await Promise.all([
    new Promise((res, rej) => {
      const tx = db.transaction(STORE_DATA, "readonly");
      const req = tx.objectStore(STORE_DATA).getAll();
      req.onsuccess = (e) => res(e.target.result);
      req.onerror   = (e) => rej(e.target.error);
    }),
    new Promise((res, rej) => {
      const tx = db.transaction(STORE_META, "readonly");
      const req = tx.objectStore(STORE_META).get("meta");
      req.onsuccess = (e) => res(e.target.result || null);
      req.onerror   = (e) => rej(e.target.error);
    }),
  ]);

  db.close();

  if (!meta) return null;
  return { invoices, fetchedAt: meta.fetchedAt, count: meta.count, columns: meta.columns || [] };
}

/** Clear all Navis data from IndexedDB. */
export async function clearNavisData() {
  const db = await openDB();
  await new Promise((res, rej) => {
    const tx = db.transaction([STORE_DATA, STORE_META], "readwrite");
    tx.objectStore(STORE_DATA).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = res;
    tx.onerror    = (e) => rej(e.target.error);
  });
  db.close();
}

