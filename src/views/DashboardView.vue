<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Boxes, LayoutDashboard, LogOut, BarChart3, Download, 
  TrendingUp, AlertTriangle, Sprout, Bird, Skull, CheckCircle2 
} from 'lucide-vue-next';
import InventoryDeck from '../components/InventoryDeck.vue';
import FarmAnalytics from '../components/FarmAnalytics.vue';

const router = useRouter();
const currentTab = ref('dashboard');
const user = ref({ name: 'Amara Njeri', farm: 'Kilima Green Farm' });

// 1. Production Yields State
const productionYields = ref([
  { id: 1, type: 'Livestock', item_name: 'Fresh Hen Eggs', egg_size: 'Large', egg_condition: 'Intact', quantity: 45, unit: 'Trays', logged_at: '9/1/2026, 8:00 AM' },
  { id: 2, type: 'Livestock', item_name: 'Fresh Hen Eggs', egg_size: 'Large', egg_condition: 'Cracked', quantity: 12, unit: 'Pieces', logged_at: '9/1/2026, 8:15 AM' },
  { id: 3, type: 'Livestock', item_name: 'Fresh Hen Eggs', egg_size: 'Medium', egg_condition: 'Broken', quantity: 5, unit: 'Pieces', logged_at: '9/1/2026, 8:20 AM' },
  { id: 4, type: 'Crop', item_name: 'Roma Tomatoes', egg_size: null, egg_condition: null, quantity: 120, unit: 'Pieces', logged_at: '9/1/2026, 2:30 PM' },
  { id: 5, type: 'Crop', item_name: 'Bell Peppers (Green)', egg_size: null, egg_condition: null, quantity: 85, unit: 'Pieces', logged_at: '8/31/2026, 5:45 PM' },
]);

// 2. Inventory & Survival Raw Data
const items = ref([
  { id: 1, name: 'Holstein Friesian Cow', category: 'Animal', stock_count: 14, location: 'Barn A - Pen 3', survival_status: 'Alive', health_status: 'Healthy', last_updated: '9/1/2026, 8:30 AM' },
  { id: 2, name: 'Dorper Sheep', category: 'Animal', stock_count: 28, location: 'Paddock 2', survival_status: 'Alive', health_status: 'Malnourished', last_updated: '9/1/2026, 9:15 AM' },
  { id: 3, name: 'Roma Tomato Seedlings', category: 'Seedling', stock_count: 250, location: 'Greenhouse 1', survival_status: 'Alive', health_status: 'Healthy', last_updated: '8/31/2026, 4:00 PM' },
  { id: 4, name: 'Wilted Bell Pepper Sprouts', category: 'Seedling', stock_count: 35, location: 'Greenhouse 2 - Tray 4', survival_status: 'Dead', health_status: 'Root Rot', last_updated: '9/1/2026, 10:00 AM' },
  { id: 5, name: 'Hass Avocado Saplings', category: 'Seedling', stock_count: 5, location: 'Nursery Bed B', survival_status: 'Alive', health_status: 'Healthy', last_updated: '8/30/2026, 2:10 PM' },
]);

// Timeframe Filter State ('Weekly' | 'Monthly')
const reportTimeframe = ref('Weekly');

// 3. Compute Aggregated Production Summary (Display state for Template Deck)
const aggregatedProductionReport = computed(() => {
  const summary = {};
  productionYields.value.forEach(p => {
    const key = `${p.item_name} ${p.egg_condition ? '(' + p.egg_condition + ')' : ''}`;
    const multiplier = reportTimeframe.value === 'Monthly' ? 4 : 1;
    if (!summary[key]) {
      summary[key] = { 
        name: key, 
        total_quantity: 0, 
        unit: p.unit, 
        type: p.type,
        condition: p.egg_condition 
      };
    }
    summary[key].total_quantity += (p.quantity * multiplier);
  });
  return Object.values(summary);
});

// 4. Compute Aggregated Inventory & Survival Tracking Summary (Display state for Template Deck)
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

  const multiplier = reportTimeframe.value === 'Monthly' ? 3.7 : 1;

  items.value.forEach(item => {
    const count = Math.round(item.stock_count * multiplier);
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

// Separated & Categorized CSV Export Handler
const exportToCSV = (filename, sourceData) => {
  let exportRows = [];

  if (filename.includes('Production')) {
    // Separate by Production Type (Livestock vs Crop)
    productionYields.value.forEach(p => {
      const multiplier = reportTimeframe.value === 'Monthly' ? 4 : 1;
      const itemName = `${p.item_name}${p.egg_condition ? ' (' + p.egg_condition + ')' : ''}`;
      
      exportRows.push({
        'Category': p.type,
        'Timeframe': reportTimeframe.value,
        'Item / Product': itemName,
        'Quantity': p.quantity * multiplier,
        'Unit': p.unit
      });
    });
    // Sort rows so categories group cleanly (Crop, then Livestock)
    exportRows.sort((a, b) => a['Category'].localeCompare(b['Category']));

  } else if (filename.includes('Survival')) {
    // Separate by Category (Livestock vs Seedlings)
    const multiplier = reportTimeframe.value === 'Monthly' ? 3.7 : 1;
    
    const calculateCategoryStats = (categoryName, categoryFilter) => {
      let total = 0, alive = 0, loss = 0;
      items.value
        .filter(i => i.category === categoryFilter)
        .forEach(i => {
          const count = Math.round(i.stock_count * multiplier);
          total += count;
          if (i.survival_status === 'Alive') alive += count;
          else loss += count;
        });

      const rate = total > 0 ? ((alive / total) * 100).toFixed(1) + '%' : '0%';
      return {
        'Category': categoryName,
        'Timeframe': reportTimeframe.value,
        'Total Managed Stock': total,
        'Surviving Units': alive,
        'Mortality / Wilt Loss': loss,
        'Survival Rate': rate
      };
    };

    exportRows = [
      calculateCategoryStats('Livestock', 'Animal'),
      calculateCategoryStats('Seedlings & Crops', 'Seedling')
    ];
  }

  if (!exportRows.length) return alert('No report data available to export.');

  const headers = Object.keys(exportRows[0]);
  const csvContent = [
    headers.join(','),
    ...exportRows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    user.value = JSON.parse(savedUser);
  }
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
    <header class="glass-card !rounded-none border-x-0 border-t-0 px-8 py-3.5 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <div class="p-1.5 bg-emerald-700 text-white rounded-lg">
              <Boxes class="w-4 h-4 text-white" />
            </div>
            Terra Ledger
          </div>

          <!-- Section Switcher -->
          <div class="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl text-xs font-semibold">
            <button 
              @click="currentTab = 'dashboard'"
              :class="['px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer', currentTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']"
            >
              <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
            </button>
            <button 
              @click="currentTab = 'inventory'"
              :class="['px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer', currentTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']"
            >
              <Boxes class="w-3.5 h-3.5" /> Inventory
            </button>
          </div>
        </div>

        <!-- User Profile & Logout -->
        <div class="flex items-center gap-4 text-xs">
          <div class="text-right">
            <p class="font-bold text-slate-800">{{ user.name }}</p>
            <p class="text-slate-400">{{ user.farm }}</p>
          </div>
          <button @click="handleSignOut" class="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer" title="Sign Out">
            <LogOut class="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-6xl mx-auto px-8 pt-8">
      <!-- DASHBOARD TAB -->
      <div v-if="currentTab === 'dashboard'" class="space-y-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">Farm Analytics</h2>
            <p class="text-xs text-slate-500 mt-0.5">Real-time metrics, survival rate tracking, and periodic aggregate reports.</p>
          </div>

          <!-- Controls for Timeframe & CSV Exports -->
          <div class="flex items-center gap-3">
            <select v-model="reportTimeframe" class="glass-input px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
            </select>

            <button 
              @click="exportToCSV(`${reportTimeframe}_Survival_Report`, aggregatedSurvivalReport)"
              class="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download :size="14" /> {{ reportTimeframe }} Survival CSV
            </button>

            <button 
              @click="exportToCSV(`${reportTimeframe}_Production_Report`, aggregatedProductionReport)"
              class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download :size="14" /> {{ reportTimeframe }} Production CSV
            </button>
          </div>
        </div>

        <!-- 1. WEEKLY & MONTHLY INVENTORY & SURVIVAL REPORT DECK -->
        <div class="glass-card p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="text-emerald-700" :size="20" />
              <h3 class="text-base font-bold text-slate-800">{{ reportTimeframe }} Inventory & Survival Tracking Report</h3>
            </div>
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {{ reportTimeframe }} Survival Rate: {{ aggregatedSurvivalReport.survival_rate }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Managed Stock</span>
                <Boxes :size="16" class="text-slate-500" />
              </div>
              <p class="text-2xl font-black text-slate-800 mt-2">{{ aggregatedSurvivalReport.total_units }} <span class="text-xs font-semibold text-slate-500">Units</span></p>
              <p class="text-[11px] text-slate-500 mt-1">Combined Livestock & Seedling units</p>
            </div>

            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">Surviving Livestock</span>
                <Bird :size="16" class="text-amber-600" />
              </div>
              <p class="text-2xl font-black text-slate-800 mt-2">{{ aggregatedSurvivalReport.livestock_alive }} <span class="text-xs font-semibold text-slate-500">Heads</span></p>
              <p class="text-[11px] text-emerald-600 font-semibold mt-1">100% Healthy & Active</p>
            </div>

            <div class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Surviving Seedlings</span>
                <Sprout :size="16" class="text-emerald-600" />
              </div>
              <p class="text-2xl font-black text-slate-800 mt-2">{{ aggregatedSurvivalReport.seedlings_alive }} <span class="text-xs font-semibold text-slate-500">Units</span></p>
              <p class="text-[11px] text-slate-500 mt-1">Active nursery growth</p>
            </div>

            <div class="p-4 bg-rose-50/40 rounded-2xl border border-rose-100">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-600">Mortality / Wilt Loss</span>
                <Skull :size="16" class="text-rose-600" />
              </div>
              <p class="text-2xl font-black text-rose-700 mt-2">{{ aggregatedSurvivalReport.dead_wilted_loss }} <span class="text-xs font-semibold text-rose-500">Units</span></p>
              <p class="text-[11px] text-rose-600 font-medium mt-1">{{ reportTimeframe }} logged losses</p>
            </div>
          </div>
        </div>

        <!-- 2. WEEKLY & MONTHLY PRODUCTION YIELD REPORT DECK -->
        <div class="glass-card p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div class="flex items-center gap-2">
              <BarChart3 class="text-emerald-700" :size="20" />
              <h3 class="text-base font-bold text-slate-800">{{ reportTimeframe }} Production & Output Summary</h3>
            </div>
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {{ reportTimeframe }} Production
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div 
              v-for="rep in aggregatedProductionReport" 
              :key="rep.name" 
              class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/60 flex items-center justify-between"
            >
              <div>
                <span :class="[
                  'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider',
                  rep.type === 'Crop' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                ]">
                  {{ rep.type }}
                </span>
                <h4 class="text-xs font-bold text-slate-800 mt-1.5">{{ rep.name }}</h4>
                <p class="text-xl font-black text-slate-800 mt-1">
                  {{ rep.total_quantity }} <span class="text-xs font-semibold text-slate-500">{{ rep.unit }}</span>
                </p>
              </div>

              <div :class="[
                'p-2.5 rounded-xl text-white',
                rep.condition === 'Broken' ? 'bg-rose-600' :
                rep.condition === 'Cracked' ? 'bg-amber-600' : 'bg-emerald-600'
              ]">
                <TrendingUp v-if="!rep.condition || rep.condition === 'Intact'" :size="18" />
                <AlertTriangle v-else :size="18" />
              </div>
            </div>
          </div>
        </div>

        <!-- Embedded Farm Analytics Component -->
        <FarmAnalytics />
      </div>

      <!-- INVENTORY TAB -->
      <div v-else>
        <InventoryDeck />
      </div>
    </main>
  </div>
</template>