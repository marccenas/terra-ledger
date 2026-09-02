<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Boxes, LayoutDashboard, LogOut, BarChart3, Download, 
  TrendingUp, AlertTriangle, Sprout, Bird, Skull, CheckCircle2,
  Eye, Calendar, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle, Clock,
  Search, Filter, RotateCcw
} from 'lucide-vue-next';
import InventoryDeck from '../components/InventoryDeck.vue';
import FarmAnalytics from '../components/FarmAnalytics.vue';
import { supabase } from '../lib/supabaseClient';
import { exportPreOrganizedExcel } from '../utils/excelExporter';

const router = useRouter();
const currentTab = ref('dashboard');
const user = ref({ name: 'Amara Njeri', farm: 'Kilima Green Farm' });

// 1. Loading & Database State Controls
const isLoading = ref(false);
const productionYields = ref([]);
const items = ref([]);

// Database Fetch Methods
const fetchProductionYields = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('production_yields')
      .select('*');

    if (error) {
      console.error('Supabase Yield Error:', error);
      alert(`Yield Error: ${error.message}`);
    } else {
      console.log('Fetched Yields:', data);
      productionYields.value = data || [];
    }
  } catch (err) {
    console.error('Fetch Exception:', err);
  } finally {
    isLoading.value = false;
  }
};

const fetchInventoryItems = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');

    if (error) {
      console.error('Supabase Inventory Error:', error);
      alert(`Inventory Error: ${error.message}`);
    } else {
      console.log('Fetched Inventory:', data);
      items.value = data || [];
    }
  } catch (err) {
    console.error('Fetch Exception:', err);
  }
};

// Harvest-Card Specific Search, Filter & Pagination State
const harvestSearchQuery = ref('');
const harvestCategoryFilter = ref('All');
const selectedDate = ref('2026-09-01');
const currentPage = ref(1);
const itemsPerPage = ref(4);

// Crash-Proof Filtered Harvests Computation
const filteredDailyHarvests = computed(() => {
  if (!Array.isArray(productionYields.value)) return [];

  return productionYields.value.filter(item => {
    if (!item) return false;

    // Handle flexible timestamp column names safely
    const logDate = item.logged_at || item.created_at || '';
    const matchesDate = logDate.includes(selectedDate.value);

    const searchLower = harvestSearchQuery.value.toLowerCase().trim();
    const matchesSearch = !searchLower || 
                          (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
                          (item.egg_condition && item.egg_condition.toLowerCase().includes(searchLower));
    
    let matchesCategory = true;
    if (harvestCategoryFilter.value !== 'All' && item.type) {
      matchesCategory = item.type.toLowerCase() === harvestCategoryFilter.value.toLowerCase() ||
                        (harvestCategoryFilter.value === 'Seedling' && item.type === 'Crop');
    }

    return matchesDate && matchesSearch && matchesCategory;
  });
});

const totalPages = computed(() => Math.ceil(filteredDailyHarvests.value.length / itemsPerPage.value) || 1);

const paginatedHarvests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredDailyHarvests.value.slice(start, start + itemsPerPage.value);
});

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages.value) currentPage.value = newPage;
};

watch([harvestSearchQuery, harvestCategoryFilter, selectedDate], () => {
  currentPage.value = 1;
});

const clearHarvestFilters = () => {
  harvestSearchQuery.value = '';
  harvestCategoryFilter.value = 'All';
  currentPage.value = 1;
};

const reportTimeframe = ref('Weekly');

// Modal State Controls
const isModalOpen = ref(false);
const activeSelectedItem = ref(null);

const openItemModal = (item) => {
  activeSelectedItem.value = item;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  activeSelectedItem.value = null;
};

// Dummy map structures for modal timeline and history
const seedlingMilestones = ref({});
const itemHistoryMap = ref({});

// Global Reports Aggregation (Defensive checks added)
const aggregatedProductionReport = computed(() => {
  if (!Array.isArray(productionYields.value)) return [];
  const summary = {};

  productionYields.value.forEach(p => {
    if (!p || !p.item_name) return;
    const key = `${p.item_name} ${p.egg_condition ? '(' + p.egg_condition + ')' : ''}`;
    const multiplier = reportTimeframe.value === 'Monthly' ? 4 : 1;

    if (!summary[key]) {
      summary[key] = { 
        name: key, 
        total_quantity: 0, 
        unit: p.unit || 'units', 
        type: p.type || 'Produce', 
        condition: p.egg_condition || '' 
      };
    }
    summary[key].total_quantity += ((Number(p.quantity) || 0) * multiplier);
  });
  return Object.values(summary);
});

const aggregatedSurvivalReport = computed(() => {
  const summary = { 
    total_units: 0, 
    alive_units: 0, 
    dead_units: 0, 
    survival_rate: '0%', 
    livestock_alive: 0, 
    seedlings_alive: 0, 
    dead_wilted_loss: 0 
  };

  if (!Array.isArray(items.value)) return summary;
  const multiplier = reportTimeframe.value === 'Monthly' ? 3.7 : 1;

  items.value.forEach(item => {
    if (!item) return;
    const count = Math.round((Number(item.stock_count) || 0) * multiplier);
    summary.total_units += count;

    if (item.survival_status === 'Alive') {
      summary.alive_units += count;
      if (item.category === 'Animal') summary.livestock_alive += count;
      if (item.category === 'Seedling') summary.seedlings_alive += count;
    } else {
      summary.dead_units += count;
      summary.dead_wilted_loss += count;
    }
  });

  if (summary.total_units > 0) {
    summary.survival_rate = ((summary.alive_units / summary.total_units) * 100).toFixed(1) + '%';
  }
  return summary;
});

// Dynamic 4-Card Overview Metrics computed from Supabase inventory data
const dynamicAnalyticsStats = computed(() => {
  const animals = aggregatedSurvivalReport.value?.livestock_alive || 0;
  const seedlings = aggregatedSurvivalReport.value?.seedlings_alive || 0;
  const total = aggregatedSurvivalReport.value?.total_units || 0;
  const dead = aggregatedSurvivalReport.value?.dead_wilted_loss || 0;

  const lossPct = total > 0 ? ((dead / total) * 100).toFixed(1) : '0.0';
  const healthPct = total > 0 ? (((total - dead) / total) * 100).toFixed(1) : '100.0';

  return {
    totalAnimals: animals,
    animalGrowth: 'Active',
    totalSeedlings: seedlings,
    seedlingGrowth: 'Nursery',
    lossRate: `${lossPct}%`,
    lossImprovement: Number(lossPct) > 5 ? 'High loss level' : 'Normal range',
    healthIndex: `${healthPct}%`,
    locationsCount: 6
  };
});

const handleExcelExport = async (type) => {
  try {
    if (type === 'Survival') {
      const survival = aggregatedSurvivalReport.value || {};
      const stats = dynamicAnalyticsStats.value || {};

      const sections = [
        {
          title: 'Executive Summary Overview',
          data: [
            { 'Metric': 'Timeframe', 'Value': reportTimeframe.value },
            { 'Metric': 'Overall Survival Rate', 'Value': survival.survival_rate || '0%' },
            { 'Metric': 'Health Index', 'Value': stats.healthIndex || '100%' },
            { 'Metric': 'Loss Rate', 'Value': stats.lossRate || '0%' }
          ]
        },
        {
          title: 'Stock Breakdown Table',
          data: [
            { 'Category': 'Total Managed Stock', 'Quantity': survival.total_units || 0, 'Unit': 'Units' },
            { 'Category': 'Surviving Livestock', 'Quantity': survival.livestock_alive || 0, 'Unit': 'Heads' },
            { 'Category': 'Surviving Seedlings', 'Quantity': survival.seedlings_alive || 0, 'Unit': 'Units' },
            { 'Category': 'Total Mortality / Loss', 'Quantity': survival.dead_wilted_loss || 0, 'Unit': 'Units' }
          ]
        }
      ];

      exportPreOrganizedExcel(sections, `${reportTimeframe.value}_Survival_Organized_Report`, 'Survival Analysis');

    } else if (type === 'Production') {
      const yields = aggregatedProductionReport.value || [];
      const harvests = filteredDailyHarvests.value || [];

      const sections = [
        {
          title: `${reportTimeframe.value} Aggregated Yield Totals`,
          data: yields.map(y => ({
            'Item Name': y.name,
            'Type': y.type,
            'Total Yield': y.total_quantity,
            'Unit': y.unit,
            'Condition Status': y.condition || 'Intact'
          }))
        },
        {
          title: `Daily Harvest Logs (${selectedDate.value})`,
          data: harvests.map(h => ({
            'Item / Produce': h.item_name,
            'Category Type': h.type,
            'Logged Quantity': h.quantity,
            'Unit': h.unit,
            'Egg Condition': h.egg_condition || 'N/A',
            'Timestamp': h.logged_at || h.created_at || 'N/A'
          }))
        }
      ];

      exportPreOrganizedExcel(sections, `${reportTimeframe.value}_Production_Organized_Report`, 'Production Analysis');
    }
  } catch (error) {
    console.error('Organized Export Failed:', error);
    alert(`Export Error: ${error.message}`);
  }
};

onMounted(() => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) user.value = JSON.parse(savedUser);

  fetchProductionYields();
  fetchInventoryItems();
});

const handleSignOut = () => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('user');
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-slate-100/60 font-sans text-slate-800 pb-12">
    <!-- Top Glass Navigation Bar -->
    <header class="glass-card !rounded-none border-x-0 border-t-0 px-4 sm:px-8 py-3.5 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <div class="flex items-center justify-between w-full sm:w-auto gap-4">
          <div class="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <div class="p-1.5 bg-emerald-700 text-white rounded-lg flex items-center justify-center">
              <Boxes class="w-4 h-4 text-white" />
            </div>
            Terra Ledger
          </div>
          <div class="flex sm:hidden items-center gap-2 text-xs">
            <button @click="handleSignOut" class="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer" title="Sign Out">
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex items-center justify-center w-full sm:w-auto gap-1 bg-slate-200/50 p-1 rounded-xl text-xs font-semibold">
          <button @click="currentTab = 'dashboard'" :class="['flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer', currentTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
          <button @click="currentTab = 'inventory'" :class="['flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer', currentTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">
            <Boxes class="w-3.5 h-3.5" /> Inventory
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-4 text-xs">
          <div class="text-right">
            <p class="font-bold text-slate-800">{{ user?.name || 'User' }}</p>
            <p class="text-slate-400">{{ user?.farm || 'Farm' }}</p>
          </div>
          <button @click="handleSignOut" class="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer" title="Sign Out">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
      <div v-if="currentTab === 'dashboard'" class="space-y-6 sm:space-y-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Farm Analytics</h2>
            <p class="text-xs text-slate-500 mt-0.5">Real-time metrics, daily harvest logs, and growth stage progression.</p>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <select v-model="reportTimeframe" class="glass-input px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer w-full sm:w-auto">
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
            </select>

            <div class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button @click="handleExcelExport('Survival')" class="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full">
                <Download :size="14" /> <span class="truncate">{{ reportTimeframe }} Survival</span>
              </button>
              <button @click="handleExcelExport('Production')" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full">
                <Download :size="14" /> <span class="truncate">{{ reportTimeframe }} Production</span>
              </button>
            </div>
          </div>
        </div>

        <!-- DYNAMIC 4-CARD METRICS COMPONENT -->
        <FarmAnalytics :stats="dynamicAnalyticsStats" />

        <!-- DAILY HARVESTS & PRODUCTION LOGS CARD -->
        <div class="glass-card p-3.5 sm:p-6 space-y-4 max-w-full overflow-hidden">
          
          <!-- Header & Date Picker -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-800 leading-tight">Daily Harvest & Production Logs</h3>
              <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Filter or search harvest entries specifically for {{ selectedDate }}.</p>
            </div>
            
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Calendar :size="16" class="text-slate-400 shrink-0" />
              <input 
                v-model="selectedDate" 
                type="date" 
                class="glass-input w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer appearance-none" 
              />
            </div>
          </div>

          <!-- Dedicated Search & Category Filter Controls -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            
            <!-- Search Input -->
            <div class="relative w-full md:w-72">
              <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input 
                v-model="harvestSearchQuery" 
                type="text" 
                placeholder="Search harvests..." 
                class="w-full pl-9 pr-8 py-2 md:py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button 
                v-if="harvestSearchQuery" 
                @click="harvestSearchQuery = ''" 
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X :size="13" />
              </button>
            </div>

            <!-- Category Filter Buttons -->
            <div class="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none]">
              <span class="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                <Filter :size="13" /> Filter:
              </span>
              <button 
                v-for="cat in ['All', 'Livestock', 'Seedling']" 
                :key="cat"
                @click="harvestCategoryFilter = cat"
                :class="[
                  'px-3 py-1.5 md:py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 touch-manipulation', 
                  harvestCategoryFilter === cat ? 'bg-emerald-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                ]"
              >
                {{ cat === 'Seedling' ? 'Seedlings & Crops' : cat }}
              </button>

              <button 
                v-if="harvestSearchQuery || harvestCategoryFilter !== 'All'"
                @click="clearHarvestFilters"
                class="px-2.5 py-1.5 md:py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 touch-manipulation"
                title="Reset filters"
              >
                <RotateCcw :size="12" /> Reset
              </button>
            </div>
          </div>

          <!-- TABLE CONTAINER -->
          <div class="w-full overflow-x-auto -mx-3.5 px-3.5 sm:mx-0 sm:px-0 my-1 touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            <table class="w-full min-w-[560px] text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th class="py-2.5 px-3 whitespace-nowrap">Item / Produce</th>
                  <th class="py-2.5 px-3 whitespace-nowrap">Type</th>
                  <th class="py-2.5 px-3 whitespace-nowrap">Yield / Quantity</th>
                  <th class="py-2.5 px-3 whitespace-nowrap">Logged At</th>
                  <th class="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                <tr v-for="harvest in paginatedHarvests" :key="harvest.id" class="hover:bg-slate-50/80 transition">
                  <td class="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {{ harvest.item_name }}
                    <span v-if="harvest.egg_condition" class="text-[10px] text-slate-400 font-normal">({{ harvest.egg_condition }})</span>
                  </td>
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', harvest.type === 'Crop' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800']">
                      {{ harvest.type }}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-extrabold text-slate-800 whitespace-nowrap">{{ harvest.quantity }} {{ harvest.unit }}</td>
                  <td class="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {{ 
                      harvest?.logged_at || 
                      (harvest?.created_at ? new Date(harvest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A') 
                    }}
                  </td>
                  <td class="py-3 px-3 text-right whitespace-nowrap">
                    <button 
                      @click="openItemModal(harvest)" 
                      class="inline-flex items-center gap-1 px-3 py-1.5 md:py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer touch-manipulation"
                    >
                      <Eye :size="14" /> View Details
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredDailyHarvests.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-400 italic">No matching harvest records found for {{ selectedDate }}.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div v-if="filteredDailyHarvests.length > 0" class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span class="font-medium text-slate-600">Page {{ currentPage }} of {{ totalPages }}</span>
            <div class="flex items-center gap-1.5">
              <button 
                @click="changePage(currentPage - 1)" 
                :disabled="currentPage === 1" 
                class="p-2 sm:p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer touch-manipulation flex items-center justify-center"
              >
                <ChevronLeft :size="16" />
              </button>
              <button 
                @click="changePage(currentPage + 1)" 
                :disabled="currentPage === totalPages" 
                class="p-2 sm:p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer touch-manipulation flex items-center justify-center"
              >
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>

        </div>

        <!-- INVENTORY & SURVIVAL REPORT DECK -->
        <div class="glass-card p-4 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="text-emerald-700 shrink-0" :size="20" />
              <h3 class="text-sm sm:text-base font-bold text-slate-800">{{ reportTimeframe }} Inventory & Survival Tracking Report</h3>
            </div>
            <span class="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Survival Rate: {{ aggregatedSurvivalReport?.survival_rate || '0%' }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Managed Stock</span>
                <Boxes :size="16" class="text-slate-500" />
              </div>
              <p class="text-xl sm:text-2xl font-black text-slate-800 mt-2">{{ aggregatedSurvivalReport?.total_units || 0 }} <span class="text-xs font-semibold text-slate-500">Units</span></p>
            </div>

            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">Surviving Livestock</span>
                <Bird :size="16" class="text-amber-600" />
              </div>
              <p class="text-xl sm:text-2xl font-black text-slate-800 mt-2">{{ aggregatedSurvivalReport?.livestock_alive || 0 }} <span class="text-xs font-semibold text-slate-500">Heads</span></p>
            </div>

            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Surviving Seedlings</span>
                <Sprout :size="16" class="text-emerald-600" />
              </div>
              <p class="text-xl sm:text-2xl font-black text-slate-800 mt-2">{{ aggregatedSurvivalReport?.seedlings_alive || 0 }} <span class="text-xs font-semibold text-slate-500">Units</span></p>
            </div>

            <div class="p-4 bg-rose-50/40 rounded-2xl border border-rose-100">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-600">Mortality / Loss</span>
                <Skull :size="16" class="text-rose-600" />
              </div>
              <p class="text-xl sm:text-2xl font-black text-rose-700 mt-2">{{ aggregatedSurvivalReport?.dead_wilted_loss || 0 }} <span class="text-xs font-semibold text-rose-500">Units</span></p>
            </div>
          </div>
        </div>

        <!-- PRODUCTION YIELD REPORT DECK -->
        <div class="glass-card p-4 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div class="flex items-center gap-2">
              <BarChart3 class="text-emerald-700 shrink-0" :size="20" />
              <h3 class="text-sm sm:text-base font-bold text-slate-800">{{ reportTimeframe }} Production Output Summary</h3>
            </div>
            <span class="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {{ reportTimeframe }} Aggregates
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
            <div 
              v-for="rep in aggregatedProductionReport" 
              :key="rep.name" 
              class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60 flex items-center justify-between"
            >
              <div>
                <span :class="['px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider', rep.type === 'Crop' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800']">
                  {{ rep.type }}
                </span>
                <h4 class="text-xs font-bold text-slate-800 mt-1.5">{{ rep.name }}</h4>
                <p class="text-lg sm:text-xl font-black text-slate-800 mt-1">
                  {{ rep.total_quantity }} <span class="text-xs font-semibold text-slate-500">{{ rep.unit }}</span>
                </p>
              </div>

              <div :class="['p-2.5 rounded-xl text-white shrink-0', rep.condition === 'Broken' ? 'bg-rose-600' : rep.condition === 'Cracked' ? 'bg-amber-600' : 'bg-emerald-600']">
                <TrendingUp v-if="!rep.condition || rep.condition === 'Intact'" :size="18" />
                <AlertTriangle v-else :size="18" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- INVENTORY TAB -->
      <div v-else>
        <InventoryDeck />
      </div>
    </main>

    <!-- ITEM HISTORY & MILESTONE MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="glass-card bg-white w-full max-w-xl p-6 rounded-2xl shadow-xl relative max-h-[85vh] overflow-y-auto">
        <button @click="closeModal" class="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition cursor-pointer">
          <X :size="18" />
        </button>

        <div class="space-y-6">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {{ activeSelectedItem?.type }} Item Tracking
            </span>
            <h3 class="text-lg sm:text-xl font-bold text-slate-800 mt-1">{{ activeSelectedItem?.item_name }}</h3>
            <p class="text-xs text-slate-500">Historical records and growth stage progression.</p>
          </div>

          <!-- Seedling Growth Milestones -->
          <div v-if="seedlingMilestones[activeSelectedItem?.item_name]" class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sprout :size="16" class="text-emerald-600" /> Growth Stage Milestones
            </h4>
            
            <div class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div v-for="(m, idx) in seedlingMilestones[activeSelectedItem?.item_name]" :key="idx" class="relative flex items-start gap-3">
                <div :class="['absolute -left-6 top-0.5 p-1 rounded-full text-white', m.completed ? 'bg-emerald-600' : 'bg-slate-300']">
                  <component :is="m.icon" :size="12" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-800">{{ m.stage }}</span>
                    <span class="text-[10px] text-slate-400">({{ m.date }})</span>
                  </div>
                  <p class="text-[11px] text-slate-500">{{ m.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Historical Daily Log Table -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar :size="16" class="text-slate-500" /> Recorded Harvest History
            </h4>
            
            <div class="border border-slate-200/80 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th class="py-2 px-3">Date</th>
                    <th class="py-2 px-3">Day</th>
                    <th class="py-2 px-3">Yield Count</th>
                    <th class="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(hist, idx) in (itemHistoryMap[activeSelectedItem?.item_name] || [])" :key="idx" class="hover:bg-slate-50">
                    <td class="py-2 px-3 font-semibold text-slate-800">{{ hist.date }}</td>
                    <td class="py-2 px-3 text-slate-500">{{ hist.day }}</td>
                    <td class="py-2 px-3 font-bold text-emerald-700">{{ hist.yield }}</td>
                    <td class="py-2 px-3 text-slate-500">{{ hist.status }}</td>
                  </tr>
                  <tr v-if="!itemHistoryMap[activeSelectedItem?.item_name]">
                    <td colspan="4" class="py-4 text-center text-slate-400 italic">No historical dates recorded for this item.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>