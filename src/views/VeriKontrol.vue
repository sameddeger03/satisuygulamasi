<script setup lang="ts">
import {onMounted, onUnmounted, computed} from "vue";

const ipcRenderer = window.ipcRenderer;
import { useStore } from 'vuex';

const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);


onMounted(() => {

});
onUnmounted(() => {

});

function temizle(degisken:any){
  let deger:any;
  if(typeof iletisim.value.ayarlar[degisken] == "string") deger = "";
  else if(iletisim.value.ayarlar[degisken] == true) deger = false;
  else if(iletisim.value.ayarlar[degisken] == false) deger = true;
  store.dispatch("iletisimDeposu/ayarKaydet", { degisken, deger });
}

</script>
<template>
  <h1>Veri Kontrolü</h1>
  <div class="alert alert-warning m-3">Dikkat! Eğer yetkili ve bilgili değilseniz bu ekranı kullanmayınız.</div>

  <div class="row m-1">
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <span>Kayıtlar</span>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item" v-for="(ayar, index) in iletisim.ayarlar">{{index}}: <b>{{ayar}}</b>
            <button
                @click="()=>temizle(index)"
                class="float-end btn btn-danger"><i class="bi bi-x-circle"></i></button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
