<script setup lang="ts">
import { Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-vue-next';

defineProps<{
  message?: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
    <div class="relative mb-8">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="relative w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-slate-700/50">
        <div class="relative">
          <ImageIcon class="w-16 h-16 text-slate-600" />
          <div class="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles class="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>

    <h2 class="text-2xl font-bold text-white mb-3 tracking-tight">
      {{ message || '暂无图片' }}
    </h2>
    
    <p class="text-slate-400 text-center max-w-md mb-8 leading-relaxed">
      {{ description || '开始导入图片，使用智能标签功能进行分类管理' }}
    </p>

    <div class="flex flex-col sm:flex-row gap-3 items-center">
      <div class="flex items-center gap-2 text-slate-500 text-sm">
        <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
          <ImageIcon class="w-4 h-4" />
        </div>
        <span>支持拖拽导入</span>
      </div>
      
      <div class="hidden sm:block w-px h-6 bg-slate-700"></div>
      
      <div class="flex items-center gap-2 text-slate-500 text-sm">
        <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
          <Sparkles class="w-4 h-4" />
        </div>
        <span>智能标签分类</span>
      </div>
    </div>

    <div class="mt-12 flex items-center gap-2 text-slate-600 text-sm animate-bounce">
      <span>点击右上角</span>
      <ArrowRight class="w-4 h-4" />
      <span class="text-blue-400 font-medium">导入按钮</span>
      <span>开始使用</span>
    </div>
  </div>
</template>
