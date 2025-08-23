<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  acik : { type: Number, default: -1 },
  hazir: { type: Boolean, default: false }
});

</script>

<template>
  <span v-if="hazir" class="me-1 ms-1">
    <span class="text text-warning" v-if="!acik">
      <i class="bi bi-database-slash" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="Cihaza yedekleme yapılmayacak."></i>
    </span>
    <span class="text text-success" v-else>
      <i class="bi bi-database" data-zorla="1" data-bs-toggle="tooltip" data-bs-placement="top" title="Cihaza yedekleme yapılacak."></i>
    </span>
  </span>
</template>
