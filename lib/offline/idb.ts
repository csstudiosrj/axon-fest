// Wrapper mínimo de IndexedDB com Promises (sem dependências).

export type Lojas = Record<string, { keyPath?: string; indices?: string[] }>;

export function abrirBanco(nome: string, versao: number, lojas: Lojas): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(nome, versao);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [loja, cfg] of Object.entries(lojas)) {
        const store = db.objectStoreNames.contains(loja)
          ? req.transaction!.objectStore(loja)
          : db.createObjectStore(loja, cfg.keyPath ? { keyPath: cfg.keyPath } : undefined);
        for (const indice of cfg.indices ?? []) {
          if (!store.indexNames.contains(indice)) store.createIndex(indice, indice);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function pedido<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function obter<T>(db: IDBDatabase, loja: string, chave: IDBValidKey): Promise<T | undefined> {
  return pedido(db.transaction(loja).objectStore(loja).get(chave)) as Promise<T | undefined>;
}

export function listar<T>(db: IDBDatabase, loja: string, indice?: string, valor?: IDBValidKey): Promise<T[]> {
  const store = db.transaction(loja).objectStore(loja);
  return pedido(indice ? store.index(indice).getAll(valor) : store.getAll()) as Promise<T[]>;
}

export function gravar<T>(db: IDBDatabase, loja: string, valor: T, chave?: IDBValidKey): Promise<IDBValidKey> {
  const tx = db.transaction(loja, "readwrite");
  return pedido(tx.objectStore(loja).put(valor, chave));
}

export async function gravarVarios<T>(db: IDBDatabase, loja: string, valores: T[]): Promise<void> {
  const tx = db.transaction(loja, "readwrite");
  const store = tx.objectStore(loja);
  valores.forEach((v) => store.put(v));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function remover(db: IDBDatabase, loja: string, chave: IDBValidKey): Promise<undefined> {
  return pedido(db.transaction(loja, "readwrite").objectStore(loja).delete(chave));
}
