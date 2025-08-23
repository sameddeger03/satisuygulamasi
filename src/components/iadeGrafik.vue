<template>

  <div class="card">
    <div class="card-body">
      <h5 class="card-title">İade Durumu</h5>
      <div class="card-text" id="iadegrafigi"></div>
    </div>
  </div>

</template>

<script setup lang="ts">
import Chart from 'chart.js/auto';
import {onMounted, onUnmounted, computed} from "vue";
import { useStore } from 'vuex';
const store = useStore();
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);
function reset(){
  const canvas: HTMLCanvasElement|null = document.getElementById('iadegrafigi_canvas') as HTMLCanvasElement||null;
  const canvasDiv: HTMLDivElement|null = document.getElementById('iadegrafigi') as HTMLDivElement||null;
  if(canvasDiv == null) return null;
  if (canvas) canvas.remove();
  const iadeGrafigi = document.createElement('canvas');
  iadeGrafigi.id = 'iadegrafigi_canvas';
  if(canvasDiv)
    canvasDiv.appendChild(iadeGrafigi);
  return iadeGrafigi;
}
function veriYok() {
  const canvas = reset() as HTMLCanvasElement|null;
  if(canvas == null) return;
  const ctx:CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  if(ctx) {
    ctx.font = "50px Arial";
    ctx.fillText("Veri yok.",10,80);
  }
}
function olustur(kullanilabilirveriler:any) {
  const canvas = reset();
  if(canvas == null) return;
  const iadeGrafigi = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  if(!Object.keys(kullanilabilirveriler)[0]) return veriYok();
  let labels = Object.keys(kullanilabilirveriler);
  let renkler = [];
  for (let i = 0; i < labels.length; i++) {
    renkler.push('#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
  }
  return new Chart(iadeGrafigi, {
    type: 'pie',
    data: {
      labels: Object.keys(kullanilabilirveriler),
      datasets: [{
        data: Object.values(kullanilabilirveriler),
        backgroundColor: renkler,
      }]
    }
  });
}
onMounted(() => {
  setTimeout(() => {
    olustur(grafikler.value.iade);
  },100)
});

onUnmounted(() => {

});

</script>
