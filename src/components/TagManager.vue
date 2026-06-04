<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-vue-next';
import { useAppStore } from '../stores/appStore';
import { TAG_COLORS } from '../types';

const emit = defineEmits<{
  close: [];
}>();

const store = useAppStore();
const editingTag = ref<string | null>(null);
const editName = ref('');
const editShortcut = ref('');
const newTagName = ref('');
const newTagColor = ref(TAG_COLORS[0]);
const newTagShortcut = ref('');
const showAddForm = ref(false);

const availableShortcuts = computed(() => {
  const tags = store.tags;
  const used = new Set(tags.map((t: any) => t.shortcut).filter(Boolean));
  if (editingTag.value) {
    const editingTagData = tags.find((t: any) => t.id === editingTag.value);
    if (editingTagData?.shortcut) {
      used.delete(editingTagData.shortcut);
    }
  }
  const all = '123456789abcdefghijklmnopqrstuvwxyz'.split('');
  return all.filter(s => !used.has(s));
});

function startEdit(tag: any) {
  editingTag.value = tag.id;
  editName.value = tag.name;
  editShortcut.value = tag.shortcut || '';
}

function saveEdit(tagId: string) {
  const tag = store.tags.find((t: any) => t.id === tagId);
  if (tag && editName.value.trim()) {
    store.updateTag({
      ...tag,
      name: editName.value.trim(),
      shortcut: editShortcut.value || undefined,
    });
  }
  editingTag.value = null;
}

function cancelEdit() {
  editingTag.value = null;
  editName.value = '';
  editShortcut.value = '';
}

function addTag() {
  if (newTagName.value.trim()) {
    store.addTag({
      name: newTagName.value.trim(),
      color: newTagColor.value,
      shortcut: newTagShortcut.value || undefined,
      order: store.tags.length,
    });
    newTagName.value = '';
    newTagShortcut.value = '';
    showAddForm.value = false;
  }
}

function deleteTag(tagId: string) {
  if (confirm('确定要删除这个标签吗？已标注的图片将变为未标注状态。')) {
    store.removeTag(tagId);
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-[#1a1a2e] rounded-xl border border-[#0f3460] shadow-2xl">
      <div class="flex items-center justify-between p-4 border-b border-[#0f3460]">
        <h2 class="text-lg font-semibold text-white">标签管理</h2>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-[#16213e] rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 max-h-[60vh] overflow-y-auto">
        <div class="space-y-2">
          <div
            v-for="tag in store.tags"
            :key="tag.id"
            class="flex items-center gap-3 p-3 bg-[#16213e] rounded-lg"
          >
            <span
              class="w-4 h-4 rounded-full flex-shrink-0"
              :style="{ backgroundColor: tag.color }"
            ></span>

            <div v-if="editingTag === tag.id" class="flex-1 flex items-center gap-2">
              <input
                v-model="editName"
                type="text"
                class="flex-1 h-8 px-2 bg-[#1a1a2e] border border-[#0f3460] rounded text-sm text-white focus:outline-none focus:border-blue-500"
                @keyup.enter="saveEdit(tag.id)"
                @keyup.esc="cancelEdit"
              />
              <select
                v-model="editShortcut"
                class="h-8 px-2 bg-[#1a1a2e] border border-[#0f3460] rounded text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">无快捷键</option>
                <option
                  v-for="s in availableShortcuts"
                  :key="s"
                  :value="s"
                >
                  {{ s }}
                </option>
              </select>
              <button
                @click="saveEdit(tag.id)"
                class="p-1.5 hover:bg-green-600/20 rounded text-green-400 transition-colors"
              >
                <Check class="w-4 h-4" />
              </button>
            </div>

            <template v-else>
              <div class="flex-1">
                <span class="text-white font-medium">{{ tag.name }}</span>
                <span
                  v-if="tag.shortcut"
                  class="ml-2 text-xs text-gray-500 bg-[#1a1a2e] px-1.5 py-0.5 rounded"
                >
                  {{ tag.shortcut }}
                </span>
              </div>

              <button
                @click="startEdit(tag)"
                class="p-1.5 hover:bg-[#0f3460] rounded text-gray-400 hover:text-white transition-colors"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                @click="deleteTag(tag.id)"
                class="p-1.5 hover:bg-red-600/20 rounded text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </template>
          </div>
        </div>

        <div v-if="showAddForm" class="mt-4 p-3 bg-[#16213e] rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <span
              v-for="color in TAG_COLORS"
              :key="color"
              @click="newTagColor = color"
              :class="[
                'w-6 h-6 rounded-full cursor-pointer transition-transform',
                newTagColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-110'
              ]"
              :style="{ backgroundColor: color }"
            ></span>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="newTagName"
              type="text"
              placeholder="标签名称"
              class="flex-1 h-9 px-3 bg-[#1a1a2e] border border-[#0f3460] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              @keyup.enter="addTag"
            />
            <select
              v-model="newTagShortcut"
              class="h-9 px-2 bg-[#1a1a2e] border border-[#0f3460] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">快捷键</option>
              <option
                v-for="s in availableShortcuts"
                :key="s"
                :value="s"
              >
                {{ s }}
              </option>
            </select>
            <button
              @click="addTag"
              class="h-9 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
            >
              添加
            </button>
          </div>
        </div>

        <button
          v-else
          @click="showAddForm = true"
          class="mt-4 w-full py-3 border-2 border-dashed border-[#0f3460] hover:border-blue-500 rounded-lg text-gray-400 hover:text-blue-400 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus class="w-5 h-5" />
          添加新标签
        </button>
      </div>
    </div>
  </div>
</template>
