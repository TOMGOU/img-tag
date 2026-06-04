import type { ImageItem, Tag } from '../types';

const DB_NAME = 'ImageTaggerDB';
const DB_VERSION = 2;

// 用于存储的图片数据格式（将 Blob 转换为 base64）
interface StoredImageItem {
  id: string;
  name: string;
  originalPath: string;
  thumbnail: string; // base64
  originalBlob?: string; // base64
  width: number;
  height: number;
  size: number;
  tagId?: string;
  createdAt: number;
  updatedAt: number;
}

class CacheService {
  private db: IDBDatabase | null = null;

  // Blob 转 base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // base64 转 Blob
  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)![1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 删除旧版本的存储（如果存在）
        if (db.objectStoreNames.contains('images')) {
          db.deleteObjectStore('images');
        }
        if (db.objectStoreNames.contains('tags')) {
          db.deleteObjectStore('tags');
        }

        // 创建新的存储（存储 base64 字符串）
        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('tagId', 'tagId', { unique: false });
        imageStore.createIndex('createdAt', 'createdAt', { unique: false });

        db.createObjectStore('tags', { keyPath: 'id' });
      };
    });
  }

  // 保存图片数据
  async saveImages(images: ImageItem[]): Promise<void> {
    if (!this.db) await this.init();

    console.log('Saving images to cache:', images.length);
    
    // 将响应式对象转换为普通对象（去除 Proxy），然后转换 Blob 为 base64
    const storedImages: StoredImageItem[] = await Promise.all(
      images.map(async (image) => {
        // 先将响应式对象转为普通对象
        const plainImage = JSON.parse(JSON.stringify(image));
        return {
          ...plainImage,
          thumbnail: await this.blobToBase64(image.thumbnail),
          originalBlob: image.originalBlob ? await this.blobToBase64(image.originalBlob) : undefined,
        };
      })
    );

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');

      store.clear();

      storedImages.forEach((image) => {
        const request = store.put(image);
        request.onerror = (e) => {
          console.error('Failed to put image:', image.id, (e.target as IDBRequest).error);
        };
      });

      transaction.oncomplete = () => {
        console.log('Images saved to cache successfully:', storedImages.length);
        resolve();
      };
      transaction.onerror = () => {
        console.error('Failed to save images:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 加载图片数据
  async loadImages(): Promise<ImageItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();

      request.onsuccess = () => {
        const storedImages: StoredImageItem[] = request.result || [];
        
        // 将 base64 转换回 Blob（同步操作）
        const images: ImageItem[] = storedImages.map((stored) => ({
          ...stored,
          thumbnail: this.base64ToBlob(stored.thumbnail),
          originalBlob: stored.originalBlob ? this.base64ToBlob(stored.originalBlob) : undefined,
        }));
        
        console.log('Images loaded from cache:', images.length);
        resolve(images);
      };
      request.onerror = () => {
        console.error('Failed to load images:', request.error);
        reject(request.error);
      };
    });
  }

  // 保存标签数据
  async saveTags(tags: Tag[]): Promise<void> {
    if (!this.db) await this.init();

    // 将响应式对象转换为普通对象（去除 Proxy）
    const plainTags = JSON.parse(JSON.stringify(tags));
    console.log('Saving tags to cache:', plainTags.length);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tags'], 'readwrite');
      const store = transaction.objectStore('tags');

      store.clear();

      plainTags.forEach((tag: Tag) => {
        const request = store.put(tag);
        request.onerror = (e) => {
          console.error('Failed to put tag:', tag.id, (e.target as IDBRequest).error);
        };
      });

      transaction.oncomplete = () => {
        console.log('Tags saved to cache successfully:', plainTags.length);
        resolve();
      };
      transaction.onerror = () => {
        console.error('Failed to save tags:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 加载标签数据
  async loadTags(): Promise<Tag[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tags'], 'readonly');
      const store = transaction.objectStore('tags');
      const request = store.getAll();

      request.onsuccess = () => {
        const tags: Tag[] = request.result || [];
        console.log('Tags loaded from cache:', tags.length);
        resolve(tags);
      };
      request.onerror = () => {
        console.error('Failed to load tags:', request.error);
        reject(request.error);
      };
    });
  }

  // 清空所有数据
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images', 'tags'], 'readwrite');
      transaction.objectStore('images').clear();
      transaction.objectStore('tags').clear();
      transaction.oncomplete = () => {
        console.log('Cache cleared');
        resolve();
      };
      transaction.onerror = () => {
        console.error('Failed to clear cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 仅清空图片数据
  async clearImages(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      store.clear();
      transaction.oncomplete = () => {
        console.log('Images cache cleared');
        resolve();
      };
      transaction.onerror = () => {
        console.error('Failed to clear images cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 仅清空标签数据（打标结果）
  async clearTags(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tags'], 'readwrite');
      const store = transaction.objectStore('tags');
      store.clear();
      transaction.oncomplete = () => {
        console.log('Tags cache cleared');
        resolve();
      };
      transaction.onerror = () => {
        console.error('Failed to clear tags cache:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // 获取缓存状态
  async getCacheInfo(): Promise<{ imageCount: number; tagCount: number; taggedCount: number; lastUpdated: number }> {
    if (!this.db) await this.init();

    const images = await this.loadImages();
    const tags = await this.loadTags();

    // 统计已打标的图片数量
    const taggedCount = images.filter(img => img.tagId).length;

    return {
      imageCount: images.length,
      tagCount: tags.length,
      taggedCount: taggedCount,
      lastUpdated: Math.max(...images.map((img) => img.updatedAt), 0),
    };
  }
}

export const cacheService = new CacheService();