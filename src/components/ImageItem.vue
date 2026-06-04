<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Check, Tag } from 'lucide-vue-next';
import type { ImageItem, Tag as TagType } from '../types';
import { blobToDataUrl } from '../utils/imageUtils';

const props = defineProps<{
  image: ImageItem;
  tags: TagType[];
}>();

const emit = defineEmits<{
  click: [];
}>();

const thumbnailUrl = ref('');
const isLoaded = ref(false);

const imageTag = computed(() => {
  if (!props.image.tagId) return null;
  return props.tags.find(t => t.id === props.image.tagId);
});

onMounted(async () => {
  try {
    thumbnailUrl.value = await blobToDataUrl(props.image.thumbnail);
    isLoaded.value = true;
  } catch (e) {
    console.error('Failed to load thumbnail:', e);
  }
});
</script>

<template>
  <div
    class="group relative aspect-square bg-[#16213e] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
    @click="emit('click')"
  >
    <img
      v-if="isLoaded"
      :src="thumbnailUrl"
      :alt="image.name"
      class="w-full h-full object-cover transition-transform group-hover:scale-105"
      loading="lazy"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center"
    >
      <div class="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
    </div>

    <div
      v-if="imageTag"
      class="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg"
      :style="{ backgroundColor: imageTag.color }"
    >
      <Check class="w-3 h-3" />
      {{ imageTag.name }}
    </div>

    <div
      v-else
      class="absolute top-2 right-2 px-2 py-1 bg-yellow-500/80 rounded-full text-xs font-medium text-white shadow-lg"
    >
      <Tag class="w-3 h-3 inline mr-1" />
      未标注
    </div>

    <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
      <p class="text-white text-xs truncate">{{ image.name }}</p>
      <p class="text-gray-400 text-xs">{{ (image.size / 1024 / 1024).toFixed(2) }} MB</p>
    </div>
  </div>
</template>
