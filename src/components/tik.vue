<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  tikli: { type: Boolean, default: false },
});

const emit = defineEmits(['guncelle']);
const checked = ref<boolean>(props.tikli as boolean);

function degistir() {
  checked.value = !checked.value;
  emit('guncelle', checked.value);
}
</script>

<template>
  <span class="bg-light p-1 rounded" @click="degistir">
    <i v-if="checked" class="bi bi-check-square"></i>
    <i v-else class="bi bi-square"></i>
  </span>
</template>

<style scoped>
span{
  cursor: pointer;
}
</style>
