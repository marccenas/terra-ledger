<script setup>
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, HeartPulse } from 'lucide-vue-next';

defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalAnimals: 0,
      animalGrowth: '+0.0%',
      totalSeedlings: 0,
      seedlingGrowth: '+0.0%',
      lossRate: '0.0%',
      lossImprovement: '0.0%',
      healthIndex: '100.0%',
      locationsCount: 1
    })
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
      <!-- Total Live Animals -->
      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Total Live Animals</span>
          <Layers class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800">
          {{ Number(stats.totalAnimals || 0).toLocaleString() }}
        </div>
        <div class="flex items-center gap-1 text-xs text-emerald-700 font-semibold mt-2">
          <ArrowUpRight class="w-3.5 h-3.5" /> {{ stats.animalGrowth || 'Verified' }}
        </div>
      </div>

      <!-- Active Seedlings -->
      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Active Seedlings</span>
          <TrendingUp class="w-4 h-4 text-teal-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800">
          {{ Number(stats.totalSeedlings || 0).toLocaleString() }}
        </div>
        <div class="flex items-center gap-1 text-xs text-emerald-700 font-semibold mt-2">
          <ArrowUpRight class="w-3.5 h-3.5" /> {{ stats.seedlingGrowth || 'Active' }}
        </div>
      </div>

      <!-- Monthly Loss Rate -->
      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Monthly Loss Rate</span>
          <ArrowDownRight class="w-4 h-4 text-rose-500" />
        </div>
        <div class="text-3xl font-bold text-slate-800">{{ stats.lossRate }}</div>
        <div class="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-2">
          {{ stats.lossImprovement }}
        </div>
      </div>

      <!-- Farm Health Index -->
      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Farm Health Index</span>
          <HeartPulse class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-3xl font-bold text-emerald-700">{{ stats.healthIndex }}</div>
        <div class="text-xs text-slate-400 mt-2">Active unit ratio</div>
      </div>
    </div>
  </div>
</template>