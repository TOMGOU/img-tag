<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Folder, FileCheck, AlertCircle } from 'lucide-vue-next';
import { useAppStore } from '../stores/appStore';

const emit = defineEmits<{
  close: [];
}>();

const store = useAppStore();
const isExporting = ref(false);
const exportProgress = ref({ current: 0, total: 0 });
const exportError = ref('');
const exportSuccess = ref(false);

const taggedImages = computed(() => {
  return store.images.filter(img => img.tagId);
});

const imagesByTag = computed(() => {
  const groups: Record<string, typeof taggedImages.value> = {};
  taggedImages.value.forEach(img => {
    if (img.tagId) {
      if (!groups[img.tagId]) {
        groups[img.tagId] = [];
      }
      groups[img.tagId].push(img);
    }
  });
  return groups;
});

async function exportImages() {
  if (taggedImages.value.length === 0) return;

  exportError.value = '';
  exportSuccess.value = false;
  isExporting.value = true;
  exportProgress.value = { current: 0, total: taggedImages.value.length };

  try {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('您的浏览器不支持文件夹选择功能，请使用 Chrome 或 Edge 浏览器');
    }

    const dirHandle = await (window as any).showDirectoryPicker();

    for (const [tagId, images] of Object.entries(imagesByTag.value)) {
      const tag = store.tags.find((t: any) => t.id === tagId);
      if (!tag) continue;

      const tagDir = await dirHandle.getDirectoryHandle(tag.name, { create: true });

      for (const image of images) {
        try {
          const fileHandle = await tagDir.getFileHandle(image.name, { create: true });
          const writable = await fileHandle.createWritable();

          const blob = image.originalBlob || image.thumbnail;
          await writable.write(blob);
          await writable.close();

          exportProgress.value.current++;
        } catch (e) {
          console.error('Failed to export image:', image.name, e);
        }
      }
    }

    exportSuccess.value = true;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      exportError.value = '导出已取消';
    } else {
      exportError.value = e.message || '导出失败';
    }
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-[#1a1a2e] rounded-xl border border-[#0f3460] shadow-2xl">
      <div class="flex items-center justify-between p-4 border-b border-[#0f3460]">
        <h2 class="text-lg font-semibold text-white">导出分类结果</h2>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-[#16213e] rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4">
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>已标注图片</span>
            <span class="text-white font-medium">{{ taggedImages.length }} / {{ store.images.length }}</span>
          </div>
          <div class="h-2 bg-[#16213e] rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 rounded-full transition-all"
              :style="{ width: `${(taggedImages.length / Math.max(store.images.length, 1)) * 100}%` }"
            ></div>
          </div>
        </div>

        <div v-if="Object.keys(imagesByTag).length > 0" class="space-y-2 mb-4">
          <div
            v-for="[tagId, images] in Object.entries(imagesByTag)"
            :key="tagId"
            class="flex items-center justify-between p-2 bg-[#16213e] rounded-lg"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: store.tags.find(t => t.id === tagId)?.color }"
              ></span>
              <span class="text-sm text-gray-300">
                {{ store.tags.find(t => t.id === tagId)?.name }}
              </span>
            </div>
            <span class="text-sm text-gray-500">{{ images.length }} 张</span>
          </div>
        </div>

        <div v-else class="text-center py-4 text-gray-500">
          还没有已标注的图片
        </div>

        <div
          v-if="exportError"
          class="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg flex items-center gap-2 text-red-400 text-sm"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ exportError }}
        </div>

        <div
          v-if="exportSuccess"
          class="mb-4 p-3 bg-green-600/20 border border-green-600/50 rounded-lg flex items-center gap-2 text-green-400 text-sm"
        >
          <FileCheck class="w-4 h-4 flex-shrink-0" />
          导出成功！
        </div>

        <div v-if="isExporting" class="mb-4">
          <div class="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>导出进度</span>
            <span>{{ exportProgress.current }} / {{ exportProgress.total }}</span>
          </div>
          <div class="h-2 bg-[#16213e] rounded-full overflow-hidden">
            <div
              class="h-full bg-green-500 rounded-full transition-all"
              :style="{ width: `${(exportProgress.current / Math.max(exportProgress.total, 1)) * 100}%` }"
            ></div>
          </div>
        </div>

        <button
          @click="exportImages"
          :disabled="isExporting || taggedImages.length === 0"
          class="w-full h-11 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Folder class="w-5 h-5" />
          {{ isExporting ? '导出中...' : '选择导出文件夹' }}
        </button>
      </div>
    </div>
  </div>
</template>
