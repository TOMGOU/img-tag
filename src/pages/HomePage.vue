<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Toolbar from '../components/Toolbar.vue';
import TagSidebar from '../components/TagSidebar.vue';
import ImageGrid from '../components/ImageGrid.vue';
import ImageViewer from '../components/ImageViewer.vue';
import TagManager from '../components/TagManager.vue';
import ExportDialog from '../components/ExportDialog.vue';
import CacheIndicator from '../components/CacheIndicator.vue';
import { Menu, X } from 'lucide-vue-next';
import { useAppStore } from '../stores/appStore';
import { createThumbnail, getImageDimensions } from '../utils/imageUtils';

const store = useAppStore();
const showViewer = ref(false);
const currentImageIndex = ref(0);
const showTagManager = ref(false);
const showExportDialog = ref(false);
const isImporting = ref(false);
const importProgress = ref({ current: 0, total: 0 });
const showSidebar = ref(false);

onMounted(async () => {
  // 从本地缓存加载数据
  await store.loadFromCache();
});

async function handleImport(files: FileList) {
  const imageFiles = Array.from(files).filter(file =>
    file.type.startsWith('image/')
  );

  if (imageFiles.length === 0) return;

  isImporting.value = true;
  importProgress.value = { current: 0, total: imageFiles.length };

  for (const file of imageFiles) {
    try {
      const [thumbnail, dimensions] = await Promise.all([
        createThumbnail(file),
        getImageDimensions(file),
      ]);

      await store.addImage({
        name: file.name,
        originalPath: file.name,
        thumbnail,
        originalBlob: file,
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
      });

      importProgress.value.current++;
    } catch (e) {
      console.error('Failed to import image:', file.name, e);
    }
  }

  isImporting.value = false;
}

function handleOpenImage(index: number) {
  currentImageIndex.value = index;
  showViewer.value = true;
}

function handleUpdateTag(imageId: string, tagId: string | undefined) {
  store.updateImageTag(imageId, tagId);
}

function handleNavigate(index: number) {
  currentImageIndex.value = index;
}

function handleClear() {
  if (confirm('确定要清空所有图片吗？此操作不可恢复。')) {
    store.clearAll();
  }
}
</script>

<template>
  <div class="h-screen flex flex-col bg-[#1a1a2e]">
    <Toolbar
      @import="handleImport"
      @export="showExportDialog = true"
      @clear="handleClear"
      @open-tag-manager="showTagManager = true"
    />

    <!-- 移动端菜单按钮 -->
    <button
      @click="showSidebar = true"
      class="md:hidden fixed top-20 left-3 z-30 p-2 bg-[#16213e] border border-[#0f3460] rounded-lg text-white shadow-lg"
    >
      <Menu class="w-5 h-5" />
    </button>

    <!-- 移动端侧边栏遮罩 -->
    <div
      v-if="showSidebar"
      class="md:hidden fixed inset-0 bg-black/50 z-40"
      @click="showSidebar = false"
    ></div>

    <div class="flex-1 flex overflow-hidden">
      <!-- 桌面端侧边栏 -->
      <div class="hidden md:block">
        <TagSidebar />
      </div>

      <!-- 移动端侧边栏 -->
      <div
        v-if="showSidebar"
        class="md:hidden fixed left-0 top-0 h-full w-48 bg-[#16213e] z-50 overflow-y-auto"
      >
        <div class="flex justify-end p-4">
          <button
            @click="showSidebar = false"
            class="p-2 hover:bg-[#0f3460] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <TagSidebar />
      </div>

      <ImageGrid @open-image="handleOpenImage" />
    </div>

    <div
      v-if="isImporting"
      class="fixed bottom-4 right-4 bg-[#16213e] border border-[#0f3460] rounded-lg p-4 shadow-xl z-40"
    >
      <div class="flex items-center gap-3">
        <div class="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div>
          <p class="text-white text-sm font-medium">正在导入图片...</p>
          <p class="text-gray-400 text-xs">{{ importProgress.current }} / {{ importProgress.total }}</p>
        </div>
      </div>
    </div>

    <ImageViewer
      v-if="showViewer"
      :images="store.filteredImages"
      :current-index="currentImageIndex"
      :tags="store.tags"
      @close="showViewer = false"
      @update-tag="handleUpdateTag"
      @navigate="handleNavigate"
    />

    <TagManager
      v-if="showTagManager"
      @close="showTagManager = false"
    />

    <ExportDialog
      v-if="showExportDialog"
      @close="showExportDialog = false"
    />

    <CacheIndicator :visible="!showViewer" />
  </div>
</template>
