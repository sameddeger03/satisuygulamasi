a<template>

  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Satış Çizelgesi</h5>
      <div class="card-text"  id="gunluksatis"></div>
    </div>
  </div>

</template>

<script setup lang="ts">
import * as Utils from '@kutuphane/index';
import Chart from 'chart.js/auto';
import {onMounted, onUnmounted, computed, defineProps } from "vue";
import { useStore } from 'vuex';
const store = useStore();
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);
const emit = defineEmits(['update:hazir']);
const props = defineProps<{
  tarih: string;
}>();

function reset(){
  const canvas: HTMLCanvasElement|null = document.getElementById('gunluksatis_canvas') as HTMLCanvasElement||null;
  const canvasDiv: HTMLDivElement|null = document.getElementById('gunluksatis') as HTMLDivElement||null;
  if(canvasDiv == null) return null;
  if (canvas) canvas.remove();
  const gunluksatis = document.createElement('canvas');
  gunluksatis.id = 'gunluksatis_canvas';
  if(canvasDiv)
    canvasDiv.appendChild(gunluksatis);
  return gunluksatis;
}
function olustur(kullanilabilirveriler: any) {

  const canvas = reset();
  if(canvas == null) return;
  const gunluksatis = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  const veriler_ = Utils.gunlukVeriler(kullanilabilirveriler,  props.tarih);
  const labels = [];
  for (let i = 1; i <= (new Date(Utils.hangiYil(new Date(props.tarih)), Utils.hangiAy(new Date(props.tarih)), 0).getDate()); i++)
    labels.push(i.toString());
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

  new Chart(gunluksatis, {
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
