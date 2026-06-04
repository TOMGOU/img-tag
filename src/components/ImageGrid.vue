<script setup lang="ts">
import { useAppStore } from '../stores/appStore';
import ImageItem from './ImageItem.vue';
import { ImageOff } from 'lucide-vue-next';

const store = useAppStore();

const emit = defineEmits<{
  openImage: [index: number];
}>();

function handleImageClick(image: any) {
  const index = store.filteredImages.findIndex(img => img.id === image.id);
  if (index !== -1) {
    emit('openImage', index);
  }
}
</script>

<template>
  <div class="flex-1 bg-[#1a1a2e] overflow-y-auto p-3 md:p-6">
    <div v-if="store.isLoading" class="flex items-center justify-center h-48 md:h-64">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p class="text-gray-400 text-sm md:text-base">加载中...</p>
      </div>
    </div>

    <div v-else-if="store.filteredImages.length === 0" class="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500">
      <ImageOff class="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 opacity-50" />
      <p class="text-base md:text-lg">暂无图片</p>
      <p class="text-xs md:text-sm mt-2">点击"导入"按钮或拖拽图片到此处</p>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
      <ImageItem
        v-for="image in store.filteredImages"
        :key="image.id"
        :image="image"
        :tags="store.tags"
        @click="handleImageClick(image)"
      />
    </div>
  </div>
</template>
