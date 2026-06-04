import { reactive, computed, watch } from 'vue';
import type { ImageItem, Tag } from '../types';
import { DEFAULT_TAGS } from '../types';
import { generateId } from '../utils/imageUtils';
import { cacheService } from '../utils/cacheService';

interface AppState {
  images: ImageItem[];
  tags: Tag[];
  selectedTagId: string | null;
  searchQuery: string;
  isLoading: boolean;
  isInitialized: boolean;
}

const state = reactive<AppState>({
  images: [],
  tags: [],
  selectedTagId: null,
  searchQuery: '',
  isLoading: false,
  isInitialized: false,
});

const filteredImages = computed(() => {
  let result = state.images;

  if (state.selectedTagId === 'untagged') {
    result = result.filter(img => !img.tagId);
  } else if (state.selectedTagId === 'tagged') {
    result = result.filter(img => img.tagId);
  } else if (state.selectedTagId) {
    result = result.filter(img => img.tagId === state.selectedTagId);
  }

  if (state.searchQuery.trim()) {
    const query = state.searchQuery.toLowerCase();
    result = result.filter(img => img.name.toLowerCase().includes(query));
  }

  return result.sort((a, b) => b.createdAt - a.createdAt);
});

const taggedCount = computed(() => state.images.filter(img => img.tagId).length);
const untaggedCount = computed(() => state.images.filter(img => !img.tagId).length);

const tagStats = computed(() => {
  const stats: Record<string, number> = {};
  state.images.forEach(img => {
    if (img.tagId) {
      stats[img.tagId] = (stats[img.tagId] || 0) + 1;
    }
  });
  return stats;
});

function initDefaultTags() {
  if (state.tags.length === 0) {
    state.tags = DEFAULT_TAGS.map(tag => ({
      ...tag,
      id: generateId(),
      createdAt: Date.now(),
    }));
  }
}

// 保存数据到本地缓存
async function saveToCache() {
  try {
    await Promise.all([
      cacheService.saveImages(state.images),
      cacheService.saveTags(state.tags),
    ]);
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
}

// 从本地缓存加载数据
async function loadFromCache() {
  if (state.isInitialized) return;

  state.isLoading = true;
  try {
    await cacheService.init();

    const [cachedImages, cachedTags] = await Promise.all([
      cacheService.loadImages(),
      cacheService.loadTags(),
    ]);

    if (cachedTags.length > 0) {
      state.tags = cachedTags;
      console.log('Loaded tags from cache:', cachedTags.length);
    } else {
      initDefaultTags();
      console.log('No cached tags found, using default tags');
    }

    if (cachedImages.length > 0) {
      state.images = cachedImages;
      console.log('Loaded images from cache:', cachedImages.length);
    } else {
      console.log('No cached images found');
    }

    state.isInitialized = true;
    console.log('Cache initialized successfully');
  } catch (error) {
    console.error('Failed to load from cache:', error);
    initDefaultTags();
    // 即使加载失败，也要设置为已初始化，以便后续可以保存
    state.isInitialized = true;
    console.log('Cache load failed, but continuing with default tags');
  } finally {
    state.isLoading = false;
  }
}

// 监听数据变化，自动保存到缓存
watch(
  () => state.images,
  () => {
    if (state.isInitialized) {
      saveToCache();
    }
  },
  { deep: true }
);

watch(
  () => state.tags,
  () => {
    if (state.isInitialized) {
      saveToCache();
    }
  },
  { deep: true }
);

async function addImage(image: Omit<ImageItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const newImage: ImageItem = {
    ...image,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.images.push(newImage);
  // 直接触发缓存保存
  if (state.isInitialized) {
    await saveToCache();
  }
  return newImage;
}

function removeImage(id: string) {
  state.images = state.images.filter(img => img.id !== id);
  // 直接触发缓存保存
  if (state.isInitialized) {
    saveToCache();
  }
}

function updateImageTag(imageId: string, tagId: string | undefined) {
  const image = state.images.find(img => img.id === imageId);
  if (image) {
    image.tagId = tagId;
    image.updatedAt = Date.now();
    console.log('Tag updated:', { imageId, tagId, isInitialized: state.isInitialized });
    // 直接触发缓存保存，确保打标结果立即保存
    if (state.isInitialized) {
      saveToCache().then(() => {
        console.log('Cache saved successfully after tag update');
      }).catch((err) => {
        console.error('Failed to save cache:', err);
      });
    } else {
      console.log('Skipping cache save: not initialized');
    }
  }
}

function addTag(tag: Omit<Tag, 'id' | 'createdAt'>) {
  const newTag: Tag = {
    ...tag,
    id: generateId(),
    createdAt: Date.now(),
  };
  state.tags.push(newTag);
  state.tags.sort((a, b) => a.order - b.order);
  // 直接触发缓存保存
  if (state.isInitialized) {
    saveToCache();
  }
  return newTag;
}

function removeTag(id: string) {
  state.tags = state.tags.filter(tag => tag.id !== id);
  state.images.forEach(img => {
    if (img.tagId === id) {
      img.tagId = undefined;
    }
  });
  // 直接触发缓存保存
  if (state.isInitialized) {
    saveToCache();
  }
}

function updateTag(tag: Tag) {
  const index = state.tags.findIndex(t => t.id === tag.id);
  if (index !== -1) {
    state.tags[index] = tag;
    state.tags.sort((a, b) => a.order - b.order);
    // 直接触发缓存保存
    if (state.isInitialized) {
      saveToCache();
    }
  }
}

async function clearAll() {
  state.images = [];
  state.tags = [];
  initDefaultTags();
  await cacheService.clearAll();
}

// 仅清空图片数据
async function clearImages() {
  state.images = [];
  await cacheService.clearImages();
}

// 仅清空打标结果（标签和图片的打标信息）
async function clearTags() {
  state.tags = [];
  state.images.forEach(img => {
    img.tagId = undefined;
    img.updatedAt = Date.now();
  });
  initDefaultTags();
  await cacheService.clearTags();
}

function setSelectedTag(tagId: string | null) {
  state.selectedTagId = tagId;
}

function setSearchQuery(query: string) {
  state.searchQuery = query;
}

// 获取缓存信息
async function getCacheInfo() {
  return await cacheService.getCacheInfo();
}

// 导出缓存服务供外部使用
function getCacheService() {
  return cacheService;
}

export function useAppStore() {
  return {
    get images() { return state.images; },
    get tags() { return state.tags; },
    get selectedTagId() { return state.selectedTagId; },
    get searchQuery() { return state.searchQuery; },
    get isLoading() { return state.isLoading; },
    get filteredImages() { return filteredImages.value; },
    get taggedCount() { return taggedCount.value; },
    get untaggedCount() { return untaggedCount.value; },
    get tagStats() { return tagStats.value; },
    loadFromCache,
    addImage,
    removeImage,
    updateImageTag,
    addTag,
    removeTag,
    updateTag,
    clearAll,
    clearImages,
    clearTags,
    setSelectedTag,
    setSearchQuery,
    getCacheInfo,
    getCacheService,
  };
}
