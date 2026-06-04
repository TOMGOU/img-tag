<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-vue-next';
import type { ImageItem, Tag } from '../types';
import { useAppStore } from '../stores/appStore';

const props = defineProps<{
  images: ImageItem[];
  currentIndex: number;
  tags: Tag[];
}>();

const emit = defineEmits<{
  close: [];
  updateTag: [imageId: string, tagId: string | undefined];
  navigate: [index: number];
}>();

const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imageUrl = ref('');
const imageRef = ref<HTMLImageElement | null>(null);
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchThreshold = 50;

const currentImage = computed(() => props.images[props.currentIndex]);

const currentTag = computed(() => {
  if (!currentImage.value?.tagId) return null;
  return props.tags.find(t => t.id === currentImage.value.tagId);
});

watch(() => props.currentIndex, async () => {
  resetView();
  await loadImage();
}, { immediate: true });

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
});

async function loadImage() {
  if (!currentImage.value) return;
  
  const store = useAppStore();
  const image = store.images.find(img => img.id === currentImage.value.id);
  
  if (image) {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value);
    }
    if (image.originalBlob) {
      imageUrl.value = URL.createObjectURL(image.originalBlob);
    } else if (image.thumbnail) {
      imageUrl.value = URL.createObjectURL(image.thumbnail);
    }
  }
}

function resetView() {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
}

function zoomIn() {
  scale.value = Math.min(scale.value * 1.2, 5);
}

function zoomOut() {
  scale.value = Math.max(scale.value / 1.2, 0.5);
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
}

function handleMouseDown(e: MouseEvent) {
  if (scale.value > 1) {
    isDragging.value = true;
    dragStart.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y };
  }
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    position.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y,
    };
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleTagSelect(tagId: string) {
  if (currentImage.value) {
    const newTagId = currentImage.value.tagId === tagId ? undefined : tagId;
    emit('updateTag', currentImage.value.id, newTagId);
  }
}

function navigatePrev() {
  if (props.currentIndex > 0) {
    emit('navigate', props.currentIndex - 1);
  }
}

function navigateNext() {
  if (props.currentIndex < props.images.length - 1) {
    emit('navigate', props.currentIndex + 1);
  }
}

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Escape':
      emit('close');
      break;
    case 'ArrowLeft':
      navigatePrev();
      break;
    case 'ArrowRight':
      navigateNext();
      break;
    default:
      const tag = props.tags.find(t => t.shortcut === e.key);
      if (tag) {
        handleTagSelect(tag.id);
      }
  }
}

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
}

function handleTouchMove(e: TouchEvent) {
  if (scale.value > 1) {
    e.preventDefault();
    const touch = e.touches[0];
    position.value = {
      x: touch.clientX - touchStartX.value + (position.value.x - dragStart.value.x),
      y: touch.clientY - touchStartY.value + (position.value.y - dragStart.value.y),
    };
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (scale.value <= 1) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.value;
    const deltaY = touch.clientY - touchStartY.value;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > touchThreshold) {
      if (deltaX < 0 && props.currentIndex < props.images.length - 1) {
        navigateNext();
      } else if (deltaX > 0 && props.currentIndex > 0) {
        navigatePrev();
      }
    }
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/95 flex flex-col">
    <div class="h-12 md:h-14 bg-[#1a1a2e] border-b border-[#0f3460] flex items-center justify-between px-3 md:px-4">
      <div class="flex items-center gap-2 md:gap-4">
        <span class="text-white font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-[200px]">
          {{ currentImage?.name }}
        </span>
        <span class="text-gray-500 text-xs md:text-sm">
          {{ currentIndex + 1 }} / {{ images.length }}
        </span>
        <span
          v-if="currentTag"
          class="px-2 py-0.5 rounded text-xs text-white"
          :style="{ backgroundColor: currentTag.color }"
        >
          {{ currentTag.name }}
        </span>
      </div>

      <div class="flex items-center gap-1 md:gap-2">
        <button
          @click="zoomOut"
          class="hidden sm:flex p-1.5 md:p-2 hover:bg-[#16213e] rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ZoomOut class="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <span class="hidden sm:block text-gray-400 text-xs md:text-sm w-12 md:w-16 text-center">{{ Math.round(scale * 100) }}%</span>
        <button
          @click="zoomIn"
          class="hidden sm:flex p-1.5 md:p-2 hover:bg-[#16213e] rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ZoomIn class="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button
          @click="resetView"
          class="hidden sm:flex p-1.5 md:p-2 hover:bg-[#16213e] rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw class="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <div class="hidden sm:block w-px h-4 md:h-6 bg-[#0f3460] mx-1 md:mx-2"></div>
        <button
          @click="emit('close')"
          class="p-1.5 md:p-2 hover:bg-red-600/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
        >
          <X class="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>

    <div
      class="flex-1 relative overflow-hidden flex items-center justify-center"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <button
        v-if="currentIndex > 0"
        @click="navigatePrev"
        class="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-[#16213e]/80 hover:bg-[#16213e] rounded-full text-white transition-colors"
      >
        <ChevronLeft class="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <img
        v-if="imageUrl"
        ref="imageRef"
        :src="imageUrl"
        :alt="currentImage?.name"
        class="max-w-full max-h-full object-contain transition-transform"
        :style="{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default'
        }"
        draggable="false"
      />

      <button
        v-if="currentIndex < images.length - 1"
        @click="navigateNext"
        class="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-[#16213e]/80 hover:bg-[#16213e] rounded-full text-white transition-colors"
      >
        <ChevronRight class="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </div>

    <div class="h-16 md:h-20 bg-[#1a1a2e] border-t border-[#0f3460] flex items-center px-3 md:px-4 overflow-x-auto overflow-y-hidden">
      <div class="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          v-for="tag in tags"
          :key="tag.id"
          @click="handleTagSelect(tag.id)"
          :class="[
            'px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 md:gap-2 shrink-0',
            currentImage?.tagId === tag.id
              ? 'text-white shadow-lg'
              : 'bg-[#16213e] text-gray-300 hover:bg-[#0f3460] hover:text-white'
          ]"
          :style="currentImage?.tagId === tag.id ? { backgroundColor: tag.color } : {}"
        >
          <span class="text-xs opacity-70">{{ tag.shortcut }}</span>
          {{ tag.name }}
        </button>
      </div>
    </div>
  </div>
</template>
