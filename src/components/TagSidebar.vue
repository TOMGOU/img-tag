<script setup lang="ts">
import { computed } from 'vue';
import { 
  Image as ImageIcon, 
  ImageOff, 
  CheckCircle2, 
  Tag as TagIcon,
  LayoutGrid,
  FileImage
} from 'lucide-vue-next';
import { useAppStore } from '../stores/appStore';

const store = useAppStore();

const allStats = computed(() => ({
  total: store.images.length,
  tagged: store.taggedCount,
  untagged: store.untaggedCount,
}));

const tagWithStats = computed(() => {
  return store.tags.map(tag => ({
    ...tag,
    count: store.tagStats[tag.id] || 0,
  }));
});

function selectTag(tagId: string | null) {
  store.setSelectedTag(tagId);
}
</script>

<template>
  <div class="w-52 md:w-60 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 flex flex-col shadow-xl">
    <!-- Stats Section -->
    <div class="p-4 border-b border-slate-700/30">
      <h3 class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">统计</h3>
      <div class="space-y-2">
        <button
          @click="selectTag(null)"
          :class="[
            'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200',
            store.selectedTagId === null 
              ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10' 
              : 'hover:bg-slate-700/50 text-slate-300'
          ]"
        >
          <div class="flex items-center gap-3">
            <div :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              store.selectedTagId === null ? 'bg-blue-500/20' : 'bg-slate-700/50'
            ]">
              <LayoutGrid class="w-4 h-4" />
            </div>
            <span class="text-sm font-medium">全部图片</span>
          </div>
          <span :class="[
            'text-xs px-2.5 py-1 rounded-full font-medium',
            store.selectedTagId === null 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-slate-700 text-slate-400'
          ]">{{ allStats.total }}</span>
        </button>

        <button
          @click="selectTag('untagged')"
          :class="[
            'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200',
            store.selectedTagId === 'untagged' 
              ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10' 
              : 'hover:bg-slate-700/50 text-slate-300'
          ]"
        >
          <div class="flex items-center gap-3">
            <div :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              store.selectedTagId === 'untagged' ? 'bg-amber-500/20' : 'bg-slate-700/50'
            ]">
              <ImageOff class="w-4 h-4" />
            </div>
            <span class="text-sm font-medium">未标注</span>
          </div>
          <span :class="[
            'text-xs px-2.5 py-1 rounded-full font-medium',
            store.selectedTagId === 'untagged' 
              ? 'bg-amber-500/20 text-amber-400' 
              : 'bg-slate-700 text-slate-400'
          ]">{{ allStats.untagged }}</span>
        </button>

        <button
          @click="selectTag('tagged')"
          :class="[
            'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200',
            store.selectedTagId === 'tagged' 
              ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10' 
              : 'hover:bg-slate-700/50 text-slate-300'
          ]"
        >
          <div class="flex items-center gap-3">
            <div :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              store.selectedTagId === 'tagged' ? 'bg-emerald-500/20' : 'bg-slate-700/50'
            ]">
              <CheckCircle2 class="w-4 h-4" />
            </div>
            <span class="text-sm font-medium">已标注</span>
          </div>
          <span :class="[
            'text-xs px-2.5 py-1 rounded-full font-medium',
            store.selectedTagId === 'tagged' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-slate-700 text-slate-400'
          ]">{{ allStats.tagged }}</span>
        </button>
      </div>
    </div>

    <!-- Tags Section -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-slate-400 text-xs font-medium uppercase tracking-wider">标签分类</h3>
        <div class="flex items-center gap-1.5 text-xs text-slate-500">
          <FileImage class="w-3.5 h-3.5" />
          <span>{{ tagWithStats.length }}</span>
        </div>
      </div>
      <div class="space-y-1.5">
        <button
          v-for="tag in tagWithStats"
          :key="tag.id"
          @click="selectTag(tag.id)"
          :class="[
            'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200',
            store.selectedTagId === tag.id 
              ? 'bg-slate-700/80 shadow-md' 
              : 'hover:bg-slate-700/50'
          ]"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: tag.color + '20' }"
            >
              <TagIcon class="w-4 h-4" :style="{ color: tag.color }" />
            </div>
            <span class="text-sm font-medium text-slate-300">{{ tag.name }}</span>
          </div>
          <span 
            class="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-600/50 text-slate-400"
          >
            {{ tag.count }}
          </span>
        </button>

        <div v-if="tagWithStats.length === 0" class="text-center py-6 text-slate-500 text-sm">
          <ImageIcon class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>暂无标签</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-slate-700/30 bg-black/10">
      <div class="flex items-center justify-center gap-2 text-slate-500 text-xs">
        <span>共 {{ allStats.total }} 张图片</span>
        <span class="w-1 h-1 rounded-full bg-slate-600"></span>
        <span>{{ allStats.tagged }} 已标注</span>
      </div>
    </div>
  </div>
</template>
