<template>
  <div :class="durum?'d-none':''" class="d-flex flex-column align-items-center justify-content-center w-100 h-100">
    <div class="spinner-border" role="status"></div>
    Yükleniyor...
  </div>
</template>
<script setup lang="ts">
import {ref} from "vue";
const props = defineProps({
  durum: Boolean,
})
const durum = ref<boolean>(props.durum);
</script>