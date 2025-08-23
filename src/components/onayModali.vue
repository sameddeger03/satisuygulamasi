<script setup lang="ts">
import {ref} from 'vue';

const onayModali = ref<HTMLDivElement>();
const onayMetni = ref<string>("");
const onayBasligi = ref<string>("");
const evetF = ref<() => void>(() => {});
const hayirF = ref<() => void>(() => {});
const onayZamani = ref(false);

const onayAl = (baslik: string, metin: string, evetFo: () => void, hayirFo: () => void = ()=>{}) => {
  onayBasligi.value = baslik;
  onayMetni.value = metin;
  evetF.value = evetFo;
  hayirF.value = hayirFo;
  onayZamani.value = true;
}

function sonuc(olumlu: boolean) {
  if(!onayModali.value) return;
  onayModali.value.getElementsByClassName("card")[0].classList.remove("animate__backInDown");
  onayModali.value.getElementsByClassName("card")[0].classList.add("animate__backOutDown");
  setTimeout(() => {
    onayZamani.value = false;
  }, 900);
  if (olumlu)
    evetF.value();
  else
    hayirF.value();
}

defineExpose({ onayAl });
</script>

<template>
  <div v-if="onayZamani" class="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50" tabindex="-1" ref="onayModali">
    <div class="d-flex justify-content-center align-items-center align-content-center w-100 h-100">
      <div class="card animate__animated animate__backInDown w-25">
        <div class="card-header">
          {{onayBasligi}}
        </div>
        <div class="card-body">
          <div v-html="onayMetni" ></div>
        </div>
        <div class="card-footer">
          <div class="d-flex justify-content-between  gal-2">
          <button type="button" class="btn btn-success" @click="()=>sonuc(false)">Vazgeç</button>
          <button type="button" class="btn btn-danger" @click="()=>sonuc(true)">Kabul Ediyorum!</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
