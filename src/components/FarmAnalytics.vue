<script setup>
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, HeartPulse } from 'lucide-vue-next';

defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalAnimals: '1,532',
      animalGrowth: '+14.2%',
      totalSeedlings: '11,700',
      seedlingGrowth: '+8.5%',
      lossRate: '1.8%',
      lossImprovement: '-0.4%',
      healthIndex: '98.4%',
      locationsCount: 6
    })
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Total Live Animals</span>
          <Layers class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800">{{ stats.totalAnimals }}</div>
        <div class="flex items-center gap-1 text-xs text-emerald-700 font-semibold mt-2">
          <ArrowUpRight class="w-3.5 h-3.5" /> {{ stats.animalGrowth }} from last month
        </div>
      </div>

      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Active Seedlings</span>
          <TrendingUp class="w-4 h-4 text-teal-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800">{{ stats.totalSeedlings }}</div>
        <div class="flex items-center gap-1 text-xs text-emerald-700 font-semibold mt-2">
          <ArrowUpRight class="w-3.5 h-3.5" /> {{ stats.seedlingGrowth }} nursery growth
        </div>
      </div>

      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Monthly Loss Rate</span>
          <ArrowDownRight class="w-4 h-4 text-rose-500" />
        </div>
        <div class="text-3xl font-bold text-slate-800">{{ stats.lossRate }}</div>
        <div class="flex items-center gap-1 text-xs text-rose-600 font-semibold mt-2">
          {{ stats.lossImprovement }} improvement
        </div>
      </div>

      <div class="glass-card p-5">
        <div class="flex justify-between items-center text-slate-500 mb-2">
          <span class="text-xs font-medium">Farm Health Index</span>
          <HeartPulse class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-3xl font-bold text-emerald-700">{{ stats.healthIndex }}</div>
        <div class="text-xs text-slate-400 mt-2">Optimal conditions across {{ stats.locationsCount }} locations</div>
      </div>
    </div>
  </div>
</template>