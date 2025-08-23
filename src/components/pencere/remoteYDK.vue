<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useStore} from "vuex";
import {Modal} from "bootstrap";
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const ipcRenderer = window.ipcRenderer;

const props = defineProps({
  durum: { type: Boolean, default: false },
  internet: { type: Boolean, default: false },
  sunucu: { type: Boolean, default: false },
})
const islemvar = ref(false);
const remoteYDK = ref<HTMLDivElement>();
const removeYDKModal = ref<Modal>();
const token = ref<string>("");
const sonYedekTarihi = ref<string>("");
const kullaniciAdi = ref<string>();
const sifre = ref<string>();

onMounted(() => {
  document.querySelectorAll(".modal-backdrop").forEach((element:Element) =>
      element.remove()
  );
})
onUnmounted(() => {
  ipcRenderer.removeAllListeners('kontrol.internet-response')
  ipcRenderer.removeAllListeners('ayar-kaydet-response')
})
watch(() => props.durum, (eski,yeni) => {
  if(eski != yeni) durum(yeni);
})

function durum(ne:boolean){
  if(remoteYDK.value && !removeYDKModal.value){
    removeYDKModal.value = new Modal(remoteYDK.value,
        { keyboard: false, backdrop: "static" });
  }
  if(ne)
    removeYDKModal.value?.show();
  else
    removeYDKModal.value?.hide();
}
async function girisyap() {
  islemvar.value = true;
  const sonuc = await ipcRenderer.invoke('giris-yap', {"kullanici": kullaniciAdi.value, "sifre":sifre.value});
  if (sonuc.durum) {
    await store.dispatch("iletisimDeposu/ayarKaydet", {degisken: "token", deger: sonuc.token});
    ipcRenderer.send("ayar-kaydet", { degisken: "token", deger: sonuc.token });
    token.value = sonuc.token;
  }
  else store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: sonuc.mesaj });
  islemvar.value = false;
}

async function cikisyap() {
  islemvar.value = true;
  await store.dispatch("iletisimDeposu/ayarKaydet", {degisken: "token", deger: ""});
  ipcRenderer.send("ayar-kaydet", { degisken: "token", deger: "" });
  token.value = "";
  islemvar.value = false;
}
</script>

<template>
  <div class="modal" ref="remoteYDK"  tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Bulut Hesabına Yedekleme</h5>
          <button type="button" class="btn-close" aria-label="Kapat" @click="()=>durum(false)"></button>
        </div>
        <div class="modal-body">
          <div v-if="!internet" class="mt-3 mb-auto mx-auto alert alert-danger">
            Internet bağlantısı yok.
          </div>
          <div v-else-if="!sunucu" class="mt-3 mb-auto mx-auto alert alert-danger">
            Bulut sunucusu çalışmıyor. Daha sonra tekrar deneyin.
          </div>
          <div v-else-if="token==''" class="mt-3 mb-auto mx-auto alert alert-info">
            <p>Giriş yapın.</p>
            <div class="mb-3">
              <label for="kullanci"  class="form-label">Kullanıcı adı:</label>
              <input type="text" v-model="kullaniciAdi" class="form-control" id="kullanci">
            </div>
            <div class="mb-3">
              <label for="sifre"  class="form-label">Şifre:</label>
              <input type="password" v-model="sifre" class="form-control" id="sifre">
            </div>
            <button class="btn btn-primary" @click="girisyap">Giriş</button>
          </div>
          <div v-else-if="token!=''" class="mt-auto mb-auto mx-auto alert alert-primary">
            <div class="alert alert-light">En son yedekleme: {{sonYedekTarihi}}</div>
            <button class="btn btn-danger" @click="cikisyap">Çıkış Yap</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>