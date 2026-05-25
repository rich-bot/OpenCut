import type { StorageAdapter } from "./types";

interface StoredFileRecord {
	id: string;
	file: Blob;
	name: string;
	type: string;
	lastModified: number;
}

export class IndexedDBFileAdapter implements StorageAdapter<File> {
	private dbName: string;
	private storeName: string;
	private version: number;

	constructor({
		dbName,
		storeName,
		version = 1,
	}: {
		dbName: string;
		storeName: string;
		version?: number;
	}) {
		this.dbName = dbName;
		this.storeName = storeName;
		this.version = version;
	}

	private async getDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "id" });
				}
			};
		});
	}

	async get(key: string): Promise<File | null> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readonly");
		const store = transaction.objectStore(this.storeName);

		const record = await new Promise<StoredFileRecord | null>((resolve, reject) => {
			const request = store.get(key);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || null);
		});

		if (!record?.file) return null;

		if (record.file instanceof File) {
			return record.file;
		}

		return new File([record.file], record.name || key, {
			type: record.type || record.file.type,
			lastModified: record.lastModified || Date.now(),
		});
	}

	async set({ key, value: file }: { key: string; value: File }): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readwrite");
		const store = transaction.objectStore(this.storeName);

		const record: StoredFileRecord = {
			id: key,
			file,
			name: file.name,
			type: file.type,
			lastModified: file.lastModified,
		};

		await new Promise<void>((resolve, reject) => {
			const request = store.put(record);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async remove(key: string): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readwrite");
		const store = transaction.objectStore(this.storeName);

		await new Promise<void>((resolve, reject) => {
			const request = store.delete(key);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async list(): Promise<string[]> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readonly");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.getAllKeys();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result as string[]);
		});
	}

	async clear(): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readwrite");
		const store = transaction.objectStore(this.storeName);

		await new Promise<void>((resolve, reject) => {
			const request = store.clear();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	static isSupported(): boolean {
		return (
			typeof window !== "undefined" &&
			"indexedDB" in window &&
			typeof File !== "undefined"
		);
	}
}
