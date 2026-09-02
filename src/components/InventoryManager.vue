<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Search as SearchIcon, Edit2, Trash2, Boxes, Sprout, Bird, Egg, Tag } from 'lucide-vue-next';

const items = ref([]);
const productionYields = ref([]);
const isLoading = ref(true);

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
};

// --- API FETCH FUNCTIONS ---
const fetchInventory = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('id', { ascending: false });
      
    if (error) throw error;
    items.value = data || [];
  } catch (err) {
    console.error('Error fetching inventory:', err.message);
  }
};

const fetchProductionYields = async () => {
  try {
    const { data, error } = await supabase
      .from('production_yields')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    productionYields.value = data || [];
  } catch (err) {
    console.error('Error fetching production records:', err.message);
  }
};

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([fetchInventory(), fetchProductionYields()]);
  isLoading.value = false;
});

// Search & Filtering Logic
const searchQuery = ref('');
const activeCategory = ref('All');

const animalCount = computed(() => 
  items.value
    .filter(i => i.category === 'Animal' && i.survival_status === 'Alive')
    .reduce((acc, curr) => acc + (curr.stock_count || 0), 0)
);

const seedlingCount = computed(() => 
  items.value
    .filter(i => i.category === 'Seedling' && i.survival_status === 'Alive')
    .reduce((acc, curr) => acc + (curr.stock_count || 0), 0)
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

// Modal State & Forms
const isInventoryModalOpen = ref(false);
const isProductionModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

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

// --- API ACTIONS ---
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
      production_date: null,
      expiry_date: null,
    };
  }
  isInventoryModalOpen.value = true;
};

const saveInventoryItem = async () => {
  try {
    const payload = {
      name: inventoryForm.value.name,
      category: inventoryForm.value.category,
      stock_count: inventoryForm.value.stock_count,
      location: inventoryForm.value.location,
      survival_status: inventoryForm.value.survival_status,
      health_status: inventoryForm.value.health_status,
      batch_no: inventoryForm.value.batch_no || null,
      production_date: inventoryForm.value.production_date || null,
      expiry_date: inventoryForm.value.expiry_date || null,
      updated_at: new Date().toISOString(),
    };

    if (isEditing.value) {
      const { error } = await supabase
        .from('inventory')
        .update(payload)
        .eq('id', currentId.value);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('inventory')
        .insert([payload]);
      if (error) throw error;
    }

    await fetchInventory();
    isInventoryModalOpen.value = false;
  } catch (err) {
    alert('Failed to save record: ' + err.message);
  }
};

const deleteInventoryItem = async (id) => {
  if (confirm('Are you sure you want to delete this record?')) {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchInventory();
    } catch (err) {
      alert('Failed to delete record: ' + err.message);
    }
  }
};

const saveProductionRecord = async () => {
  try {
    const payload = {
      type: productionForm.value.type,
      item_name: productionForm.value.item_name,
      egg_size: productionForm.value.type === 'Livestock' ? productionForm.value.egg_size : null,
      quantity: productionForm.value.quantity,
      unit: productionForm.value.unit,
      date: new Date().toISOString().split('T')[0],
    };

    const { error } = await supabase
      .from('production_yields')
      .insert([payload]);

    if (error) throw error;

    await fetchProductionYields();
    productionForm.value = { type: 'Crop', item_name: '', egg_size: 'Large', quantity: 0, unit: 'Pieces' };
    isProductionModalOpen.value = false;
  } catch (err) {
    alert('Failed to log harvest: ' + err.message);
  }
};
</script>