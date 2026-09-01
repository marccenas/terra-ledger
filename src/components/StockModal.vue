<script setup>
import { ref } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  item: Object,
  actionType: String
});

const emit = defineEmits(['close', 'save']);
const quantity = ref(1);
const note = ref('');

const handleSubmit = () => {
  emit('save', {
    itemId: props.item?.id,
    action: props.actionType,
    quantity: quantity.value,
    note: note.value
  });
  quantity.value = 1;
  note.value = '';
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="glass-card max-w-sm w-full p-6 relative">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X class="w-4 h-4" />
      </button>

      <h3 class="text-lg font-bold text-slate-800 mb-1">
        Log {{ actionType === 'gain' ? 'Gain' : 'Loss' }} for {{ item?.name }}
      </h3>
      <p class="text-xs text-slate-500 mb-4">{{ item?.breed_variety }} · {{ item?.location }}</p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
          <input v-model.number="quantity" type="number" min="1" required class="w-full glass-input px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Note / Reason (Optional)</label>
          <input v-model="note" type="text" placeholder="e.g. Newborn, Transfer, Veterinary loss" class="w-full glass-input px-3 py-2 text-sm" />
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="$emit('close')" class="w-1/2 py-2 text-xs font-semibold text-slate-600">Cancel</button>
          <button type="submit" class="w-1/2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition">
            Save Record
          </button>
        </div>
      </form>
    </div>
  </div>
</template>