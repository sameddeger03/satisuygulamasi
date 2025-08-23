<template>

    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Ödeme Yöntemleri</h5>
        <div class="card-text" id="yontemgrafigi"></div>
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
    const canvas: HTMLCanvasElement|null = document.getElementById('yontemgrafigi_canvas') as HTMLCanvasElement||null;
    const canvasDiv: HTMLDivElement|null = document.getElementById('yontemgrafigi') as HTMLDivElement||null;
    if(canvasDiv == null) return null;
    if (canvas) canvas.remove();
    const yontemgrafigi = document.createElement('canvas');
    yontemgrafigi.id = 'yontemgrafigi_canvas';
    if(canvasDiv)
      canvasDiv.appendChild(yontemgrafigi);
    return yontemgrafigi;
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
    const yontemGrafigi = canvas.getContext('2d') as CanvasRenderingContext2D||null;
    if(Object.values(kullanilabilirveriler)[0] == 0 && Object.values(kullanilabilirveriler)[1] == 0) return veriYok();
    
    return new Chart(yontemGrafigi, {
      type: 'pie',
      data: {
        labels: Object.keys(kullanilabilirveriler),
        datasets: [{
          data: Object.values(kullanilabilirveriler),
          backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'],
        }]
      }
    });
  }
  onMounted(() => {
    setTimeout(() => {
      olustur(grafikler.value.yontem);
    },100)
  });

  onUnmounted(() => {

  });

</script>
