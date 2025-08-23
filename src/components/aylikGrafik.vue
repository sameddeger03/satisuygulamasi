a<template>

  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Satış Çizelgesi</h5>
      <div class="card-text" id="ayliksatis"></div>
    </div>
  </div>

</template>

<script setup lang="ts">
import * as Utils from '@kutuphane/index';
import Chart from 'chart.js/auto';
import {onMounted, onUnmounted, computed } from "vue";
import { useStore } from 'vuex';
const store = useStore();
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);
const emit = defineEmits(['update:hazir']);
function reset(){
  const canvas: HTMLCanvasElement|null = document.getElementById('ayliksatis_canvas') as HTMLCanvasElement||null;
  const canvasDiv: HTMLDivElement|null = document.getElementById('ayliksatis') as HTMLDivElement||null;
  if(canvasDiv == null) return null;
  if (canvas) canvas.remove();
  const ayliksatis = document.createElement('canvas');
  ayliksatis.id = 'ayliksatis_canvas';
  if(canvasDiv)
    canvasDiv.appendChild(ayliksatis);
  return ayliksatis;
}
function olustur(kullanilabilirveriler: any) {
  const canvas = reset();
  if(canvas == null) return;

  const ayliksatis = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  const veriler_ = Utils.aylikVeriler(kullanilabilirveriler,  new Date());
  const labels = Utils.aylar({say: 12, bolum:0});
  let maks = Number(Utils.getMaks(veriler_))*10;
  if(maks == 0) maks = 10;
  const data = {
    labels: labels,
    datasets: [
      {
        data: Object.values(veriler_),
        borderColor: Utils.CHART_COLORS.red,
        backgroundColor: Utils.transparentize(Utils.CHART_COLORS.red, 0.5),
      }
    ]
  }
  new Chart(ayliksatis, {
    type: 'line',
    data: data,

    options: {
      scales: {
        y: {
          min: 0,
          max: maks,
        }
      },
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    },
  });
  emit('update:hazir', true);
}
onMounted(() => {
  setTimeout(() => {
    olustur(grafikler.value.aylik);
  },100)
});

onUnmounted(() => {

});

</script>
