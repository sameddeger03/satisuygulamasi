<template>
  <div class="top-50 start-50 translate-middle position-absolute " style="width: 500px; z-index:1100">
    <div v-for="bildirim in bildirimler"
         :class="'animate__animated animate__fadeInLeft w-100 alert alert-'+bildirim.tip" role="alert"
         :key="bildirim.id" :id="bildirim.id">
      <h5 class="alert-heading" v-html="bildirim.baslik"></h5>
      <div v-html="bildirim.mesaj"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {computed, watch} from "vue";
import {BildirimFace} from "@interfaces/index";
import {useStore} from "vuex";

const store = useStore();
const bildirimler = computed(() => store.getters["bildirimDeposu/bildirim"]);
watch(
    () => bildirimler,
    (newValue, oldValue) => {
      bildirimler.value.forEach((bildirim_:BildirimFace) => {
        if(bildirim_.gosterildi)
          return;
        if(!bildirim_.baslik || bildirim_.baslik === ''){
          switch(bildirim_.tip){
            case 'success':
              bildirim_.baslik = 'Başarılı!';
              break;
            case 'warning':
              bildirim_.baslik = 'Uyarı!';
              break;
            case 'danger':
              bildirim_.baslik = 'Hata!';
              break;
            default: case 'info':
              bildirim_.baslik = 'Bilgilendirme';
              break;
          }
        }
        setTimeout(()=>{
          (document.getElementById(bildirim_.id) as HTMLElement).classList.remove('animate__fadeInLeft');
          (document.getElementById(bildirim_.id) as HTMLElement).classList.add('animate__fadeOutRight');
          setTimeout(()=>{
            store.dispatch('bildirimDeposu/sil', bildirim_.id);
          },bildirim_.sure-(bildirim_.sure-800))
        },bildirim_.sure-800)
        store.dispatch('bildirimDeposu/gosterildi', bildirim_.id);
      })
    },
    { deep: true }
)
</script>
<style scoped>
</style>