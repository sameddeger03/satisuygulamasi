<template>
  <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100">
    <h1 class="mb-3">{{ $t('error404.message') }}</h1>
    <button @click="router.go(-1)" class="btn btn-primary">{{ $t('error404.backButton') }}</button>
  </div>
</template>
<script setup lang="ts">
import {useRouter} from "vue-router";
const router = useRouter()
</script>
