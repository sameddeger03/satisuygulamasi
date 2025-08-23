<template>

    <div class="card">
      <div class="card-body">
        <h5 class="card-title" v-html="tip=='adetlik' ? 'Ürün Satışları (Adet Bazlı)' : 'Ürün Satışları (Kilo Bazlı)'"></h5>
        <div class="card-text" :id="tip+'_urungrafigi'"></div>
      </div>
    </div>

</template>

<script setup lang="ts">
import * as Utils from '@kutuphane/index';
import Chart from 'chart.js/auto';
import {onMounted, onUnmounted, computed} from "vue";
import { useStore } from 'vuex';
const store = useStore();
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);

interface Props {
  tip: string;
}
const props = defineProps<Props>();
const { tip } = props;
function reset(){
  const canvas: HTMLCanvasElement|null = document.getElementById(tip+'_urungrafigi_canvas') as HTMLCanvasElement||null;
  const canvasDiv: HTMLDivElement|null = document.getElementById(tip+'_urungrafigi') as HTMLDivElement||null;
  if(canvasDiv == null) return null;
  if (canvas) canvas.remove();
  const urungrafigi = document.createElement('canvas');
  urungrafigi.id = tip+'_urungrafigi_canvas';
  if(canvasDiv)
    canvasDiv.appendChild(urungrafigi);
  return urungrafigi;
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
interface oransalObje { [key: string]: string; }
function olustur(kullanilabilirveriler:any ) {
  const canvas = reset();
  if(canvas == null) return;
  const urungrafigi = canvas.getContext('2d') as CanvasRenderingContext2D||null;
  if(!Object.keys(kullanilabilirveriler)[0]) return veriYok();
  let labels = Object.keys(kullanilabilirveriler);
  const oransal:oransalObje = Utils.yuzdeyap(kullanilabilirveriler) as oransalObje;
  let renkler = [];
  for (let i = 0; i < labels.length; i++) {
    renkler.push('#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'));
    if(oransal[labels[i]])
      labels[i] = "(" + oransal[labels[i]] + ") " + labels[i];
  }


  return new Chart(urungrafigi, {
    type: 'doughnut',
    data: {
      labels: Object.keys(kullanilabilirveriler),
      datasets: [{
        data: Object.values(kullanilabilirveriler),
        backgroundColor: renkler,
      }]
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "right",
          align: "start",
          labels: {
            usePointStyle: true
          }
        }
      }
    }
  });
}
onMounted(() => {
  setTimeout(() => {
    if(tip == "adetlik")
      olustur(grafikler.value.urun.adetlik);
    if(tip == "kiloluk")
      olustur(grafikler.value.urun.kiloluk);
  },100)
});

onUnmounted(() => {

});

</script>
