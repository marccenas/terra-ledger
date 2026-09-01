<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Leaf, ArrowRight, Lock, User } from 'lucide-vue-next';

const router = useRouter();
const isLoginOpen = ref(false);
const email = ref('amara@kilima.com');
const password = ref('password123');

const handleLogin = () => {
  // Store authentication state and session payload
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify({
    name: 'Amara Njeri',
    farm: 'Kilima Green Farm',
    email: email.value
  }));

  // Redirect to Dashboard route
  router.push('/dashboard');
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex flex-col justify-between p-6 relative overflow-hidden">
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-300/40 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300/40 rounded-full blur-3xl pointer-events-none"></div>

    <nav class="flex justify-between items-center max-w-7xl mx-auto w-full z-10">
      <div class="flex items-center gap-2.5 text-emerald-900 font-bold text-xl">
        <div class="p-2 bg-emerald-700 text-white rounded-xl shadow-md">
          <Leaf class="w-5 h-5 stroke-white" />
        </div>
        Terra Ledger
      </div>
      <button 
        @click="isLoginOpen = true"
        class="px-5 py-2.5 glass-card font-semibold text-emerald-900 hover:bg-white/90 transition cursor-pointer"
      >
        Sign In
      </button>
    </nav>

    <div class="max-w-4xl mx-auto text-center z-10 my-auto py-12">
      <h1 class="text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">
        Precision Farm Inventory & Live Stock Tracking
      </h1>
      <p class="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
        Seamlessly manage livestock, crop seedlings, and live counts across pens and paddocks with real-time logs and automated updates.
      </p>
      <button 
        @click="isLoginOpen = true"
        class="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer"
      >
        Launch Dashboard <ArrowRight class="w-5 h-5 stroke-white" />
      </button>
    </div>

    <footer class="text-center text-xs text-slate-500 z-10">
      © 2026 Terra Ledger Systems. All rights reserved.
    </footer>

    <div v-if="isLoginOpen" class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="glass-card max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
        <h2 class="text-2xl font-bold text-slate-800 mb-1">Welcome Back</h2>
        <p class="text-xs text-slate-500 mb-6">Enter your credentials to access Kilima Green Farm</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <div class="relative flex items-center">
              <User 
                :size="18" 
                :stroke-width="2" 
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" 
              />
              <input 
                v-model="email" 
                type="email" 
                required 
                class="w-full glass-input pl-10 pr-4 py-3 text-sm text-slate-800 font-medium placeholder-slate-400" 
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <div class="relative flex items-center">
              <Lock 
                :size="18" 
                :stroke-width="2" 
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" 
              />
              <input 
                v-model="password" 
                type="password" 
                required 
                class="w-full glass-input pl-10 pr-4 py-3 text-sm text-slate-800 font-medium placeholder-slate-400" 
              />
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button 
              type="button" 
              @click="isLoginOpen = false" 
              class="w-1/2 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="w-1/2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>