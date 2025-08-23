<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  acik : { type: Number, default:  -1},
  hazir: { type: Boolean, default: false },
  durum1: { type: Boolean, default: false }, //internet var
  durum2: { type: Boolean, default: false }, //sunucu calisiyor
  token: { type: String, default: "" },
});

</script>

<template>
  <span v-if="hazir" class="me-1 ms-1">
    <span class="text text-warning" v-if="!acik">
      <i class="bi bi-cloud-slash" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="Sunucuya yedekleme yapılmayacak."></i>
    </span>
    <span class="text text-warning" v-else-if="token==''">
      <i class="bi bi-cloud-slash" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="Sunucuya yedekleme yapılması için giriş yapmalısınız."></i>
    </span>
    <span class="text text-success" v-else-if="durum1 && durum2">
      <i class="bi bi-cloud" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="Sunucuya yedekleme yapılabilir."></i>
    </span>
    <span class="text text-danger" v-else>
      <i class="bi bi-cloud-slash" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="Sunucuya erişilemediği için sunucuya yedekleme yapılamaz." v-if="durum1"></i>
      <i class="bi bi-wifi-off" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="İnternet bağlantısı olmadığı için sunucuya yedekleme yapılamaz." v-else></i>
    </span>
  </span>
</template>
