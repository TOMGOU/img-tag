<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Database, Trash2, RefreshCw, X, AlertTriangle } from 'lucide-vue-next';
import { useAppStore } from '../stores/appStore';

defineProps<{
  visible?: boolean;
}>();

const store = useAppStore();
const cacheInfo = ref({
  imageCount: 0,
  tagCount: 0,
  taggedCount: 0,
  lastUpdated: 0
});
const isLoading = ref(false);
const showPanel = ref(false);

// 弹窗状态
const showConfirmDialog = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmType = ref<'images' | 'tags' | 'all'>('all');

onMounted(async () => {
  await loadCacheInfo();
});

async function loadCacheInfo() {
  try {
    cacheInfo.value = await store.getCacheInfo();
  } catch (error) {
    console.error('Failed to load cache info:', error);
  }
}

function openConfirmDialog(type: 'images' | 'tags' | 'all') {
  confirmType.value = type;
  switch (type) {
    case 'images':
      confirmTitle.value = '清空图片缓存';
      confirmMessage.value = '确定要清空图片缓存吗？这将删除所有已保存的图片，但保留标签设置。';
      break;
    case 'tags':
      confirmTitle.value = '清空打标结果';
      confirmMessage.value = '确定要清空打标结果吗？这将清除所有标签和图片的打标信息，但保留图片数据。';
      break;
    case 'all':
      confirmTitle.value = '清空全部缓存';
      confirmMessage.value = '确定要清空所有缓存数据吗？这将删除所有已保存的图片和标签。';
      break;
  }
  showConfirmDialog.value = true;
}

async function handleConfirm() {
  showConfirmDialog.value = false;
  isLoading.value = true;
  try {
    switch (confirmType.value) {
      case 'images':
        await store.clearImages();
        break;
      case 'tags':
        await store.clearTags();
        break;
      case 'all':
        await store.clearAll();
        break;
    }
    await loadCacheInfo();
  } finally {
    isLoading.value = false;
  }
}

function handleCancel() {
  showConfirmDialog.value = false;
}

async function refreshCache() {
  isLoading.value = true;
  try {
    await store.loadFromCache();
    await loadCacheInfo();
  } finally {
    isLoading.value = false;
  }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '暂无更新';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<template>
  <div v-if="visible !== false" class="fixed bottom-4 left-4 z-50">
    <!-- 移动端：紧凑模式 -->
    <div class="md:hidden">
      <button
        @click="showPanel = !showPanel"
        class="w-10 h-10 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
        title="本地缓存"
      >
        <Database class="w-5 h-5" />
      </button>
      
      <Transition name="slide-up">
        <div
          v-if="showPanel"
          class="absolute bottom-14 left-0 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 shadow-2xl w-44"
        >
          <div class="flex items-center gap-2 mb-2">
            <Database class="w-4 h-4 text-blue-400" />
            <h4 class="text-white text-sm font-medium">缓存</h4>
            <span class="text-slate-500 text-xs ml-auto">{{ formatDate(cacheInfo.lastUpdated) }}</span>
          </div>
          
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{{ cacheInfo.imageCount }}图</span>
            <span class="text-green-400">{{ cacheInfo.taggedCount }}标</span>
            <span class="text-purple-400">{{ cacheInfo.tagCount }}签</span>
          </div>

          <div class="space-y-1">
            <button
              @click="refreshCache(); showPanel = false"
              :disabled="isLoading"
              class="w-full h-7 px-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <RefreshCw :class="['w-3 h-3', isLoading && 'animate-spin']" />
              刷新
            </button>
            
            <div class="flex gap-1">
              <button
                @click="openConfirmDialog('images'); showPanel = false"
                :disabled="isLoading"
                class="flex-1 h-7 px-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 class="w-3 h-3" />
                图片
              </button>
              <button
                @click="openConfirmDialog('tags'); showPanel = false"
                :disabled="isLoading"
                class="flex-1 h-7 px-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <Trash2 class="w-3 h-3" />
                打标
              </button>
            </div>
            
            <button
              @click="openConfirmDialog('all'); showPanel = false"
              :disabled="isLoading"
              class="w-full h-7 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 class="w-3 h-3" />
              清空全部
            </button>
          </div>
        </div>
      </Transition>
    </div>
    
    <!-- 桌面端：完整模式 -->
    <div class="hidden md:block">
      <div class="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-2xl w-52">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Database class="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 class="text-white text-sm font-medium">本地缓存</h4>
            <p class="text-slate-400 text-xs">{{ formatDate(cacheInfo.lastUpdated) }}</p>
          </div>
        </div>
        
        <div class="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>{{ cacheInfo.imageCount }} 图</span>
          </div>
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>{{ cacheInfo.taggedCount }} 标</span>
          </div>
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>{{ cacheInfo.tagCount }} 签</span>
          </div>
        </div>

        <div class="space-y-2">
          <button
            @click="refreshCache"
            :disabled="isLoading"
            class="w-full h-8 px-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw :class="['w-3 h-3', isLoading && 'animate-spin']" />
            刷新缓存
          </button>
          
          <div class="flex gap-2">
            <button
              @click="openConfirmDialog('images')"
              :disabled="isLoading"
              class="flex-1 h-8 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              title="清空图片缓存"
            >
              <Trash2 class="w-3 h-3" />
              <span>图片</span>
            </button>
            <button
              @click="openConfirmDialog('tags')"
              :disabled="isLoading"
              class="flex-1 h-8 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              title="清空打标结果"
            >
              <Trash2 class="w-3 h-3" />
              <span>打标</span>
            </button>
          </div>
          
          <button
            @click="openConfirmDialog('all')"
            :disabled="isLoading"
            class="w-full h-8 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Trash2 class="w-3 h-3" />
            清空全部
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 自定义确认弹窗 -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showConfirmDialog"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 class="text-lg font-semibold text-white">{{ confirmTitle }}</h3>
            <button
              @click="handleCancel"
              class="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle class="w-5 h-5 text-red-400" />
              </div>
              <p class="text-slate-300 text-sm leading-relaxed">{{ confirmMessage }}</p>
            </div>
          </div>
          
          <div class="flex gap-3 p-4 border-t border-slate-700 bg-slate-800/50">
            <button
              @click="handleCancel"
              class="flex-1 h-10 px-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all"
            >
              取消
            </button>
            <button
              @click="handleConfirm"
              class="flex-1 h-10 px-4 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-all"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
