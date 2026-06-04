<script setup lang="ts">
import { ref, computed } from 'vue';
import { FolderOpen, Download, Search, Trash2, Tags, Sparkles } from 'lucide-vue-next';
import { useAppStore } from '../stores/appStore';

const store = useAppStore();
const fileInput = ref<HTMLInputElement | null>(null);
const showTagManager = ref(false);

const searchQueryValue = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val),
});

const emit = defineEmits<{
  import: [files: FileList];
  export: [];
  clear: [];
  openTagManager: [];
}>();

function handleImportClick() {
  fileInput.value?.click();
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    emit('import', input.files);
    input.value = '';
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer?.files) {
    const imageFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    if (imageFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      imageFiles.forEach(file => dataTransfer.items.add(file));
      emit('import', dataTransfer.files);
    }
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}
</script>

<template>
  <div
    class="h-16 md:h-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center px-4 md:px-6 gap-3 md:gap-4 shadow-lg"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <div class="flex items-center gap-3 group cursor-pointer">
      <div class="relative">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
      </div>
      <div class="hidden sm:block">
        <h1 class="text-white font-bold text-lg tracking-tight group-hover:text-blue-400 transition-colors">
          ImageTagger
        </h1>
        <p class="text-slate-400 text-xs -mt-0.5">智能图片标注工具</p>
      </div>
    </div>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 md:gap-3">
      <div class="relative hidden sm:block">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQueryValue"
          type="text"
          placeholder="搜索图片..."
          class="w-48 sm:w-64 h-9 pl-9 pr-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      <button
        @click="emit('openTagManager')"
        class="h-9 px-3 md:px-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-all hover:shadow-md"
        :title="'标签管理'"
      >
        <Tags class="w-4 h-4" />
        <span class="hidden sm:inline">标签管理</span>
      </button>

      <button
        @click="handleImportClick"
        class="h-9 px-3 md:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl text-sm text-white flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/25"
        :title="'导入图片'"
      >
        <FolderOpen class="w-4 h-4" />
        <span class="hidden sm:inline">导入</span>
      </button>

      <button
        @click="emit('export')"
        :disabled="store.images.length === 0"
        class="h-9 px-3 md:px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-sm text-white flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/25"
        :title="'导出分类'"
      >
        <Download class="w-4 h-4" />
        <span class="hidden sm:inline">导出</span>
      </button>

      <button
        @click="emit('clear')"
        :disabled="store.images.length === 0"
        class="h-9 px-3 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 border border-red-500/30 rounded-xl text-red-400 hover:text-red-300 transition-all"
        :title="'清空图片'"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      webkitdirectory=""
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>
