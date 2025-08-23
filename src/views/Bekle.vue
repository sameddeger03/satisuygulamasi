<template>
  <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100">
    <h1 class="mb-3">Ayarlar kaydediliyor...</h1>
  </div>
</template>
<script setup lang="ts">
import {useRouter} from "vue-router";
const router = useRouter()
setTimeout(() => {
  router.go(-1)
},100)
</script>