<template>

  <div class="card">
    <div class="card-body">
      <div class="d-flex justify-content-center align-items-center flex-column h-100">
        <div>Bugüne Kadar ki Toplam Kazanç</div>
        <div class="fs-2"> {{kazanc}} </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import { useStore } from 'vuex';
import {turklirasi} from "@kutuphane/index";
const store = useStore();
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);
const kazanc = ref("");

function olustur(kazanc_:number) {
  kazanc.value = turklirasi(kazanc_);
}

onMounted(() => {
  setTimeout(() => {
    olustur(grafikler.value.kazanc);
  },100)
});

onUnmounted(() => {

});

</script>
