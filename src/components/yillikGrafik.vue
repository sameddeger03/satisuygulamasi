a<template>

  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Satış Çizelgesi</h5>
      <div class="card-text" id="yilliksatis"></div>
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
  const canvas: HTMLCanvasElement|null = document.getElementById('yilliksatis_canvas') as HTMLCanvasElement||null;
  const canvasDiv: HTMLDivElement|null = document.getElementById('yilliksatis') as HTMLDivElement||null;
  if(canvasDiv == null) return null;
  if (canvas) canvas.remove();
  const yilliksatis = document.createElement('canvas');
  yilliksatis.id = 'yilliksatis_canvas';
  if(canvasDiv)
    canvasDiv.appendChild(yilliksatis);
  return yilliksatis;
}
function veriYok() {
  const canvas = reset() as HTMLCanvasElement|null;
  if(canvas == null) return;
  canvas.width = 300;
  canvas.height = 300;
  const ctx:CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  if(ctx) {
    ctx.font = "50px Arial";
    ctx.fillText("Veri yok.",10,80);
  }
  emit('update:hazir', true);
}
function olustur(kullanilabilirveriler: any) {
  const canvas = reset();
  if(canvas == null) return;
  const yilliksatis = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  const veriler_ = Utils.yillikVeriler(kullanilabilirveriler);
  if(Object.keys(veriler_).length == 0) return veriYok();
  let labels = Object.keys(veriler_);
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
  new Chart(yilliksatis, {
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
    olustur(grafikler.value.yillik);
  },100)
});

onUnmounted(() => {

});

</script>
