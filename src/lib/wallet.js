// Tickets and documents, kept only in this browser (IndexedDB). Never uploaded.
const DB = "locoman-wallet";
export const MAX_FILE = 5 * 1024 * 1024;

const done = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

async function withStore(mode, run) {
  const open = indexedDB.open(DB, 1);
  open.onupgradeneeded = () => open.result.createObjectStore("files", { keyPath: "id" }).createIndex("owner", "owner");
  const db = await done(open);
  try {
    return await done(run(db.transaction("files", mode).objectStore("files")));
  } finally {
    db.close();
  }
}

const key = (userId, tripId) => `${userId}:${tripId}`;

export const wallet = {
  list: (userId, tripId) => withStore("readonly", (s) => s.index("owner").getAll(key(userId, tripId))),
  add: (userId, tripId, file) =>
    withStore("readwrite", (s) => s.put({ id: crypto.randomUUID(), owner: key(userId, tripId), name: file.name, type: file.type, file })),
  remove: (id) => withStore("readwrite", (s) => s.delete(id)),
  clear: () => withStore("readwrite", (s) => s.clear()).catch(() => {}),
};
