<script setup>
import { ref, computed } from 'vue';
import { Plus, Search as SearchIcon, Edit2, Trash2, Boxes, Sprout, Bird, Egg, Calendar, Tag } from 'lucide-vue-next';

// Helper function to check if a date string is past today
const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
};

// 1. Centralized Inventory State (Updated with Batch Numbers & Dates)
const items = ref([
  { 
    id: 1, 
    name: 'Holstein Friesian Cow', 
    category: 'Animal', 
    stock_count: 14, 
    location: 'Barn A - Pen 3', 
    survival_status: 'Alive', 
    health_status: 'Healthy', 
    batch_no: 'LOT-LIV-001',
    production_date: '2025-05-10',
    expiry_date: '', // N/A for live animals or set to expected cycle date
    last_updated: '9/1/2026, 8:30 AM' 
  },
  { 
    id: 2, 
    name: 'Dorper Sheep', 
    category: 'Animal', 
    stock_count: 28, 
    location: 'Paddock 2', 
    survival_status: 'Alive', 
    health_status: 'Malnourished', 
    batch_no: 'LOT-LIV-002',
    production_date: '2025-11-20',
    expiry_date: '',
    last_updated: '9/1/2026, 9:15 AM' 
  },
  { 
    id: 3, 
    name: 'Roma Tomato Seedlings', 
    category: 'Seedling', 
    stock_count: 250, 
    location: 'Greenhouse 1', 
    survival_status: 'Alive', 
    health_status: 'Healthy', 
    batch_no: 'SEED-2026-08A',
    production_date: '2026-08-15',
    expiry_date: '2026-10-15',
    last_updated: '8/31/2026, 4:00 PM' 
  },
  { 
    id: 4, 
    name: 'Wilted Bell Pepper Sprouts', 
    category: 'Seedling', 
    stock_count: 35, 
    location: 'Greenhouse 2 - Tray 4', 
    survival_status: 'Dead', 
    health_status: 'Root Rot', 
    batch_no: 'SEED-2026-07C',
    production_date: '2026-07-01',
    expiry_date: '2026-08-30',
    last_updated: '9/1/2026, 10:00 AM' 
  },
  { 
    id: 5, 
    name: 'Hass Avocado Saplings', 
    category: 'Seedling', 
    stock_count: 5, 
    location: 'Nursery Bed B', 
    survival_status: 'Alive', 
    health_status: 'Healthy', 
    batch_no: 'SEED-2026-04F',
    production_date: '2026-04-10',
    expiry_date: '2027-04-10',
    last_updated: '8/30/2026, 2:10 PM' 
  },
]);

// 2. Production Yields State
const productionYields = ref([
  { id: 1, type: 'Livestock', item_name: 'Fresh Hen Eggs', egg_size: 'Large', quantity: 45, unit: 'Trays', date: '2026-09-01' },
  { id: 2, type: 'Livestock', item_name: 'Fresh Hen Eggs', egg_size: 'Medium', quantity: 20, unit: 'Trays', date: '2026-09-01' },
  { id: 3, type: 'Crop', item_name: 'Roma Tomatoes', egg_size: null, quantity: 120, unit: 'Pieces', date: '2026-09-01' },
  { id: 4, type: 'Crop', item_name: 'Bell Peppers (Green)', egg_size: null, quantity: 85, unit: 'Pieces', date: '2026-08-31' },
]);

// Search & Category Filtering
const searchQuery = ref('');
const activeCategory = ref('All');

// Dynamic Metric Card Counts
const animalCount = computed(() => 
  items.value
    .filter(i => i.category === 'Animal' && i.survival_status === 'Alive')
    .reduce((acc, curr) => acc + curr.stock_count, 0)
);

const seedlingCount = computed(() => 
  items.value
    .filter(i => i.category === 'Seedling' && i.survival_status === 'Alive')
    .reduce((acc, curr) => acc + curr.stock_count, 0)
);

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.health_status.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          (item.batch_no && item.batch_no.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesCategory = activeCategory.value === 'All' || item.category === activeCategory.value;
    return matchesSearch && matchesCategory;
  });
});

// Modal Controls
const isInventoryModalOpen = ref(false);
const isProductionModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

// Forms
const inventoryForm = ref({
  name: '',
  category: 'Seedling',
  stock_count: 0,
  location: '',
  survival_status: 'Alive',
  health_status: 'Healthy',
  batch_no: '',
  production_date: '',
  expiry_date: '',
});

const productionForm = ref({
  type: 'Crop',
  item_name: '',
  egg_size: 'Large',
  quantity: 0,
  unit: 'Pieces',
});

// Actions
const openInventoryModal = (item = null) => {
  if (item) {
    isEditing.value = true;
    currentId.value = item.id;
    inventoryForm.value = { ...item };
  } else {
    isEditing.value = false;
    currentId.value = null;
    inventoryForm.value = {
      name: '',
      category: 'Seedling',
      stock_count: 0,
      location: '',
      survival_status: 'Alive',
      health_status: 'Healthy',
      batch_no: '',
      production_date: '',
      expiry_date: '',
    };
  }
  isInventoryModalOpen.value = true;
};

const saveInventoryItem = () => {
  const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  
  if (isEditing.value) {
    const index = items.value.findIndex(i => i.id === currentId.value);
    if (index !== -1) {
      items.value[index] = { ...inventoryForm.value, id: currentId.value, last_updated: timestamp };
    }
  } else {
    items.value.push({
      id: Date.now(),
      ...inventoryForm.value,
      last_updated: timestamp,
    });
  }
  isInventoryModalOpen.value = false;
};

const deleteInventoryItem = (id) => {
  if (confirm('Are you sure you want to delete this record?')) {
    items.value = items.value.filter(i => i.id !== id);
  }
};

const saveProductionRecord = () => {
  const today = new Date().toISOString().split('T')[0];
  productionYields.value.unshift({
    id: Date.now(),
    type: productionForm.value.type,
    item_name: productionForm.value.item_name,
    egg_size: productionForm.value.type === 'Livestock' ? productionForm.value.egg_size : null,
    quantity: productionForm.value.quantity,
    unit: productionForm.value.unit,
    date: today,
  });
  productionForm.value = { type: 'Crop', item_name: '', egg_size: 'Large', quantity: 0, unit: 'Pieces' };
  isProductionModalOpen.value = false;
};
</script>

<template>
  <div class="space-y-8">
    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div 
        @click="activeCategory = 'All'"
        :class="['glass-card p-5 cursor-pointer transition transform hover:-translate-y-1', activeCategory === 'All' ? 'ring-2 ring-emerald-600 bg-white/80' : '']"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory</p>
            <h3 class="text-2xl font-black text-slate-800 mt-1">{{ items.length }} Records</h3>
          </div>
          <div class="p-3 bg-slate-100 rounded-xl text-slate-700">
            <Boxes :size="22" :stroke-width="2" />
          </div>
        </div>
      </div>

      <div 
        @click="activeCategory = 'Animal'"
        :class="['glass-card p-5 cursor-pointer transition transform hover:-translate-y-1', activeCategory === 'Animal' ? 'ring-2 ring-emerald-600 bg-white/80' : '']"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Livestock Count</p>
            <h3 class="text-2xl font-black text-slate-800 mt-1">{{ animalCount }} Heads</h3>
          </div>
          <div class="p-3 bg-amber-50 rounded-xl text-amber-700">
            <Bird :size="22" :stroke-width="2" />
          </div>
        </div>
      </div>

      <div 
        @click="activeCategory = 'Seedling'"
        :class="['glass-card p-5 cursor-pointer transition transform hover:-translate-y-1', activeCategory === 'Seedling' ? 'ring-2 ring-emerald-600 bg-white/80' : '']"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Seedling Units</p>
            <h3 class="text-2xl font-black text-slate-800 mt-1">{{ seedlingCount }} Units</h3>
          </div>
          <div class="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Sprout :size="22" :stroke-width="2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory Filter & Table -->
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 class="text-lg font-bold text-slate-800">Inventory & Survival Tracking</h3>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-64 flex items-center">
            <SearchIcon :size="16" class="absolute left-3 z-10 text-slate-400 pointer-events-none" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Filter batch #, name, location..." 
              class="w-full glass-input pl-10 pr-3 py-2 text-xs relative z-0" 
            />
          </div>
          <button @click="openInventoryModal()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Plus :size="15" /> New Stock Record
          </button>
        </div>
      </div>

      <div class="glass-card overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <thead class="bg-slate-50/50 text-slate-700 uppercase font-semibold border-b border-slate-200/60">
            <tr>
              <th class="px-5 py-3.5">Batch / Lot #</th>
              <th class="px-5 py-3.5">Name</th>
              <th class="px-5 py-3.5">Category</th>
              <th class="px-5 py-3.5">Quantity</th>
              <th class="px-5 py-3.5">Location</th>
              <th class="px-5 py-3.5">Prod / Planted Date</th>
              <th class="px-5 py-3.5">Expiry / Harvest Date</th>
              <th class="px-5 py-3.5">Survival Status</th>
              <th class="px-5 py-3.5">Health / Issue</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in filteredItems" :key="item.id" :class="['hover:bg-slate-50/50 transition', item.survival_status === 'Dead' ? 'bg-rose-50/20' : '']">
              <!-- Batch # Column -->
              <td class="px-5 py-4 font-mono font-bold text-slate-600">
                <span class="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                  <Tag :size="12" class="text-slate-400" />
                  {{ item.batch_no || 'N/A' }}
                </span>
              </td>

              <td class="px-5 py-4 font-bold text-slate-800">{{ item.name }}</td>
              
              <td class="px-5 py-4">
                <span :class="['px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider', item.category === 'Animal' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800']">
                  {{ item.category }}
                </span>
              </td>
              
              <td class="px-5 py-4 font-semibold text-slate-700">{{ item.stock_count }}</td>
              <td class="px-5 py-4 text-slate-500">{{ item.location }}</td>

              <!-- Production Date -->
              <td class="px-5 py-4 text-slate-600 font-medium">
                {{ item.production_date || '—' }}
              </td>

              <!-- Expiry / Target Harvest Date with Dynamic Alerting -->
              <td class="px-5 py-4 font-medium">
                <template v-if="item.expiry_date">
                  <span :class="['px-2 py-0.5 rounded text-[10px] font-bold', isExpired(item.expiry_date) ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'text-slate-600']">
                    {{ item.expiry_date }} {{ isExpired(item.expiry_date) ? '(Expired/Overdue)' : '' }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-slate-400">—</span>
                </template>
              </td>

              <!-- Survival Badge -->
              <td class="px-5 py-4">
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold', item.survival_status === 'Alive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200']">
                  {{ item.survival_status === 'Dead' && item.category === 'Seedling' ? 'Dead / Wilted' : item.survival_status }}
                </span>
              </td>

              <!-- Health State / Root Cause -->
              <td class="px-5 py-4">
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold', item.health_status === 'Healthy' ? 'bg-teal-50 text-teal-700' : 'bg-amber-100 text-amber-900']">
                  {{ item.health_status }}
                </span>
              </td>

              <td class="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                <button @click="openInventoryModal(item)" class="p-1.5 text-slate-400 hover:text-emerald-700 transition cursor-pointer" title="Edit"><Edit2 :size="15" /></button>
                <button @click="deleteInventoryItem(item.id)" class="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer" title="Delete"><Trash2 :size="15" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Production Section -->
    <div class="space-y-4 pt-4 border-t border-slate-200/60">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-bold text-slate-800">Production & Harvest Yields</h3>
          <p class="text-xs text-slate-500">Track egg tray outputs with specific sizes and harvest quantities by crop variety.</p>
        </div>
        <button @click="isProductionModalOpen = true" class="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer">
          <Plus :size="15" /> Log Harvest Output
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="prod in productionYields" :key="prod.id" class="glass-card p-4 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span :class="['p-1.5 rounded-lg text-white', prod.type === 'Livestock' ? 'bg-amber-600' : 'bg-emerald-600']">
                <Egg v-if="prod.type === 'Livestock'" :size="14" />
                <Sprout v-else :size="14" />
              </span>
              <h4 class="font-bold text-slate-800 text-xs">{{ prod.item_name }}</h4>
            </div>

            <div class="mt-2 flex items-center gap-2">
              <p class="text-xs font-bold text-slate-700">{{ prod.quantity }} {{ prod.unit }}</p>
              <span v-if="prod.egg_size" class="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-extrabold uppercase">
                Size: {{ prod.egg_size }}
              </span>
            </div>

            <p class="text-[10px] text-slate-400 mt-1">Logged on: {{ prod.date }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory Modal -->
    <div v-if="isInventoryModalOpen" class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-slate-800 mb-4">{{ isEditing ? 'Edit Stock Record' : 'Add New Stock / Crop Record' }}</h3>
        <form @submit.prevent="saveInventoryItem" class="space-y-3 text-xs">
          
          <!-- Batch No Input -->
          <div>
            <label class="block font-semibold mb-1 text-slate-700">Batch / Lot Number</label>
            <input v-model="inventoryForm.batch_no" type="text" class="w-full glass-input px-3 py-2 text-slate-800 font-mono" placeholder="e.g. BATCH-2026-001" />
          </div>

          <div>
            <label class="block font-semibold mb-1 text-slate-700">Item Name</label>
            <input v-model="inventoryForm.name" type="text" required class="w-full glass-input px-3 py-2 text-slate-800" placeholder="e.g. Roma Seedling / Sussex Hen" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Category</label>
              <select v-model="inventoryForm.category" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer">
                <option value="Seedling">Seedling / Crop</option>
                <option value="Animal">Animal / Livestock</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Quantity Count</label>
              <input v-model.number="inventoryForm.stock_count" type="number" min="0" required class="w-full glass-input px-3 py-2 text-slate-800" />
            </div>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-slate-700">Location / Nursery Bed</label>
            <input v-model="inventoryForm.location" type="text" required class="w-full glass-input px-3 py-2 text-slate-800" placeholder="e.g. Greenhouse 1 - Row B" />
          </div>

          <!-- Date Fields -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Production / Planted Date</label>
              <input v-model="inventoryForm.production_date" type="date" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer" />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Expiration / Target Harvest Date</label>
              <input v-model="inventoryForm.expiry_date" type="date" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Survival Status</label>
              <select v-model="inventoryForm.survival_status" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer">
                <option value="Alive">Alive / Growing</option>
                <option value="Dead">Dead / Wilted</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Health / Condition</label>
              <input v-model="inventoryForm.health_status" type="text" required class="w-full glass-input px-3 py-2 text-slate-800" placeholder="e.g. Healthy / Root Rot / Pest Damage" />
            </div>
          </div>

          <div class="flex gap-2 pt-3">
            <button type="button" @click="isInventoryModalOpen = false" class="w-1/2 py-2 text-slate-600 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="w-1/2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold transition cursor-pointer">{{ isEditing ? 'Update Item' : 'Save Record' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Production Modal -->
    <div v-if="isProductionModalOpen" class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="glass-card max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Log Harvest / Production Output</h3>
        <form @submit.prevent="saveProductionRecord" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-slate-700">Category</label>
            <select v-model="productionForm.type" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer">
              <option value="Crop">Crop Yield (Vegetables / Fruits)</option>
              <option value="Livestock">Livestock Product (Eggs / Milk)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold mb-1 text-slate-700">Variety / Produce Name</label>
            <input v-model="productionForm.item_name" type="text" required class="w-full glass-input px-3 py-2 text-slate-800" placeholder="e.g. Fresh Hen Eggs or Roma Tomatoes" />
          </div>

          <div v-if="productionForm.type === 'Livestock'">
            <label class="block font-semibold mb-1 text-slate-700">Egg Size Grade</label>
            <select v-model="productionForm.egg_size" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer">
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Extra Large">Extra Large</option>
              <option value="Jumbo">Jumbo</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Quantity</label>
              <input v-model.number="productionForm.quantity" type="number" min="1" required class="w-full glass-input px-3 py-2 text-slate-800" />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Unit Type</label>
              <select v-model="productionForm.unit" class="w-full glass-input px-3 py-2 text-slate-800 cursor-pointer">
                <option value="Trays">Trays</option>
                <option value="Pieces">Pieces</option>
                <option value="Kg">Kg</option>
                <option value="Liters">Liters</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 pt-3">
            <button type="button" @click="isProductionModalOpen = false" class="w-1/2 py-2 text-slate-600 font-medium cursor-pointer">Cancel</button>
            <button type="submit" class="w-1/2 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold transition cursor-pointer">Log Production</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>