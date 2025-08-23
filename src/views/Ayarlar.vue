<script setup lang="ts">
import {onMounted, onUnmounted, ref, computed, watch} from 'vue';
import { useStore } from 'vuex';
import {Modal} from "bootstrap";
import {trTamTarih, unixToDate} from "@kutuphane/index";
import { useRouter, useRoute} from 'vue-router';
const router = useRouter();
const route = useRoute();

const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const ipcRenderer = window.ipcRenderer;
const islemvar = ref(false);

const sirketimDiv = ref<HTMLElement>();
const sirketimModal = ref<any>();
const sirketadi = ref<string>();
const uygulamasifresi = ref<string>();
const kurusDuzelt = ref<boolean>();
const imajGoster = ref<boolean>();
const sifreGoster = ref<boolean>(false);
const localyedek = ref<boolean>();
const remoteyedek = ref<boolean>();
const kilit = ref<boolean>();
const kullaniciAdi = ref<string>();
const sifre = ref<string>();
const token = ref<string>();
const sonyedektarihi = ref<Record<string, Date|null>>({"local": null, "remote": null});
const internetDurum = ref<Record<string, boolean|null>>({"internet": null, "sunucu": null});
const sytStr = ref<Record<string, string>>({"local":"", "remote":""});
const macID = ref<string>("...");

function kaydet(){
  ipcRenderer.send("ayarlari-kaydet", [
    { degisken: "sifre", deger: uygulamasifresi.value },
    { degisken: "sirket", deger: sirketadi.value },
    { degisken: "localyedek", deger: localyedek.value },
    { degisken: "remoteyedek", deger: remoteyedek.value },
    { degisken: "kilit", deger: kilit.value },
    { degisken: "kurusDuzelt", deger: kurusDuzelt.value },
    { degisken: "imajGoster", deger: imajGoster.value }
  ])
}

function kapat(){
  sirketimModal.value.hide();
  store.dispatch("iletisimDeposu/veriKaydet", { degisken: "ayarModalAcik", deger: false });
}

function internetKontrol(){
  islemvar.value = true;
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: "internet", deger: false });
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: "sunucu", deger: false });
  internetDurum.value = {"internet": null, "sunucu": null};
  ipcRenderer.send("internet");
}

async function yedekVer(local:boolean ){
  islemvar.value = true;

  const sonuc = await ipcRenderer.invoke("yedek-ver", token.value, local);
  if (sonuc.durum) {
    await sonyedekTarihi(local);
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: sonuc.mesaj});
  }
  else store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: sonuc.mesaj});

  islemvar.value = false;
}

async function yedekAl(local:boolean ){
  await iletisim.value.onaymodali.onayAl('Yedek Kullanılacak', 'Eğer yedek dosyası eski ise veri kaybedebilirsiniz.', async () => {
    await yedekAl_onaylandi(local);
  });
}

async function yedekAl_onaylandi(local:boolean){
  islemvar.value = true;
  const sonuc = await ipcRenderer.invoke("yedek-al", token.value, local);
  if (sonuc.durum) {
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: sonuc.mesaj});
  }
  else {
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: sonuc.mesaj});
  }
  islemvar.value = false;
}

async function sonyedekTarihi(local:boolean){
  islemvar.value = true;
  if(token.value != "" || local){
    const sonuc = await ipcRenderer.invoke("son-yedek-tarihi", token.value, local);
    if (sonuc.durum){
      if(local) sonyedektarihi.value.local = unixToDate(sonuc.mesaj/1000);
      else {
        console.log(sonuc.tarih)
        sonyedektarihi.value.remote = new Date(sonuc.tarih);
      }
    }
    else {
      if(local) sonyedektarihi.value.local = null;
      else sonyedektarihi.value.remote = null;
    }
    if(sonyedektarihi.value.remote != null)sytStr.value.remote = "En son yedek alınma tarihi: "+trTamTarih(sonyedektarihi.value.remote);
    else sytStr.value.remote="Hiç yedek alınmadı."
    if(sonyedektarihi.value.local != null)sytStr.value.local = "En son yedek alınma tarihi: "+trTamTarih(sonyedektarihi.value.local);
    else sytStr.value.local="Hiç yedek alınmadı."
  }
  islemvar.value = false;
}

onMounted(() => {
  document.querySelectorAll(".modal-backdrop").forEach((element:Element) =>
      element.remove()
  );
  if(sirketimDiv.value){
    sirketimModal.value = new Modal(sirketimDiv.value,
        { keyboard: false, backdrop: "static" });
    sirketimModal.value.show();
  }
  sirketadi.value = iletisim.value.ayarlar.sirket;
  uygulamasifresi.value = iletisim.value.ayarlar.sifre || "";
  localyedek.value = iletisim.value.ayarlar.localyedek || false;
  remoteyedek.value = iletisim.value.ayarlar.remoteyedek || false;
  kilit.value = iletisim.value.ayarlar.kilit || false;
  kullaniciAdi.value = iletisim.value.ayarlar.kullanici || "";
  sifre.value = iletisim.value.ayarlar.sifre || "";
  token.value = iletisim.value.ayarlar.token || "";
  kurusDuzelt.value = iletisim.value.ayarlar.kurusDuzelt || false;
  imajGoster.value = iletisim.value.ayarlar.imajGoster || false;

  ipcRenderer.on("internet-response", (event, cevap) => {
    islemvar.value = false;
    if(cevap.durum) {
      if(cevap.veri.sunucu) {
        sonyedekTarihi(true);
        sonyedekTarihi(false);
      }
      store.dispatch('iletisimDeposu/veriKaydet', { degisken: "internet", deger: cevap.veri.internet });
      store.dispatch('iletisimDeposu/veriKaydet', { degisken: "sunucu", deger: cevap.veri.sunucu });
      internetDurum.value = {"internet": cevap.veri.internet, "sunucu": cevap.veri.sunucu};
    }
  });
  ipcRenderer.on("ayarlari-kaydet-response", (event, durum) => {
    if(durum){
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "sirket", deger: sirketadi.value });
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "sifre", deger: uygulamasifresi.value });
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "localyedek", deger: localyedek.value  });
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "remoteyedek", deger: remoteyedek.value  });
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "kilit", deger: kilit.value });
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "kurusDuzelt", deger: kurusDuzelt.value });
      store.dispatch("iletisimDeposu/ayarKaydet", { degisken: "imajGoster", deger: imajGoster.value });
      sirketimModal.value.hide();
      store.dispatch("iletisimDeposu/veriKaydet", { degisken: "ayarModalAcik", deger: false });
      router.push("/bekle")
    }else store.dispatch("bildirimDeposu/ekle", { tip: "danger", mesaj: "Ayarlar kaydedilemedi!" });
  });
  store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "elemanlariayarla", deger: true  });
  internetKontrol();
  (async() => {
    macID.value = await ipcRenderer.invoke("macid");
  })();
});
onUnmounted(() => {
  ipcRenderer.removeAllListeners('kontrol.internet-response')
  ipcRenderer.removeAllListeners('ayar-kaydet-response')
})
watch(islemvar, (eski,yeni) => {
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})
</script>
<template>
  <div class="modal" tabindex="-1" ref="sirketimDiv">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header d-flex justify-content-between">
          <h5 class="modal-title">Ayarlar</h5>

        </div>
        <div class="modal-body">
          <div class="h-100 d-flex flex-column p-1" style="margin-right: 10px">
            <div>
              <div class="mb-3">
                <label for="sirketadi"  class="form-label">Şirket Adı:</label>
                <input type="text" v-model="sirketadi" class="form-control" id="sirketadi">
              </div>
              <div class="mb-3">
                <label for="uygulamasifresi"  class="form-label">Uygulama Şifresi: (<span class="text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Eğer şifre koyarsanız uygulama başlangıcında şifre sorar. Ayrıca otomatik kilitle seçeneği aktif ise şifre sorar. Boş bırakabilirsiniz.">?</span>)</label>
                <div class="input-group">
                  <input :type="sifreGoster ? 'text' : 'password'" v-model="uygulamasifresi" class="form-control" id="uygulamasifresi" aria-describedby="sifregg">
                  <button class="btn btn-secondary" type="button" id="sifregg" @click="sifreGoster = !sifreGoster">
                    <i v-if="sifreGoster" class="bi bi-eye"></i>
                    <i v-else class="bi bi-eye-slash"></i>
                  </button>
                </div>
              </div>

              <div class="row border mb-2 p-2">
                <b class="col-12 d-flex justify-content-center mb-2">
                  Özelleştirme
                </b>
                <div class="col-5">
                  <div class="form-check">
                    <input v-model="kurusDuzelt" class="form-check-input" type="checkbox" value="">
                    <label class="form-check-label" for="flexCheckChecked">
                      Kuruş Düzelt (<span class="text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Ödeme ekranında toplam değerde kuruş 5'in katları şeklinde ilerler.">?</span>)
                    </label>
                  </div>
                </div>
                <div class="col-5">
                  <div class="form-check">
                    <input v-model="imajGoster" class="form-check-input" type="checkbox" value="">
                    <label class="form-check-label" for="flexCheckChecked">
                      İmaj Göster (<span class="text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Hızlı seçim bölümünde ürünün fotoğrafını gösterir.">?</span>)
                    </label>
                  </div>
                </div>
                <div class="col-5">
                  <div class="form-check">
                    <input v-model="kilit" class="form-check-input" type="checkbox" value="">
                    <label class="form-check-label" for="flexCheckChecked">
                      Otamatik Kilitle (<span class="text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="10 dakika boyunca bir eylemde bulunmazsanız kilit ekranını gösterir.">?</span>)
                    </label>
                  </div>
                </div>
              </div>
              <div class="border mb-2 p-2 row">
                <b class="col-12 d-flex justify-content-center mb-2">
                  Yedekleme Ayarları
                </b>
                <div class="form-check">
                  <input v-model="localyedek" class="form-check-input" type="checkbox" value="">
                  <label class="form-check-label" for="flexCheckChecked">
                    Bu Cihaza Yedek Oluştur (Önerilir) (<span class="text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Belgelerim klasörünüze saat başı yedek oluşturur. Alınan yedeği elle yükleyerek kullanabilirsiniz.">?</span>)
                  </label>
                </div>
                <div class="form-check mt-3">
                  <input v-model="remoteyedek" class="form-check-input" type="checkbox" value="">
                  <label class="form-check-label" for="flexCheckChecked">
                    Bulut Hesabına Yedek Oluştur (<span class="text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Eğer Rovave hesabınız var ise yedeklerinizi uzak sunucuya kaydedebilirsiniz. İstediğiniz zaman indirebilirsiniz.">?</span>)
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <div class="d-flex justify-content-between w-100">
              <div class="text-muted my-auto" style="font-size:8px">
                ID:<br>
                {{macID}}
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-secondary" @click="kapat">Vazgeç</button>
                <button type="button" class="btn btn-sm btn-primary ms-2" @click="kaydet">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>