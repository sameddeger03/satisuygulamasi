<template>
  <div v-if="islemvar" class="container overflow-auto mb-10 mt-4" style="height: calc(100vh - 100px)">
    <div class="alert alert-info">Rapor oluşturuluyor...</div>
  </div>
  <div v-else class="container overflow-auto mb-10 mt-4" style="height: calc(100vh - 100px)">
    <h1 class="text-center">Gün Sonu Raporu</h1>
    <div class="row mb-3 rapor">
      <div class="col-8">
        <!-- Ürün Satışları -->
        <div class="card mt-4">
          <div class="card-header">
            <h4>Nakit Ürün Satışları <span v-if="rapor.urunSay.nakit>0">(Toplam: {{ rapor.urunSay.nakit }} ürün)</span></h4>
          </div>
          <div class="card-body">
            <table v-if="filtreliurunlerNakit.length > 0" class="table">
              <thead>
              <tr>
                <th scope="col" class="col-2">Saat</th>
                <th scope="col" class="col-5">Ürün</th>
                <th scope="col" class="col-2">Miktar</th>
                <th scope="col" class="col-3">Satış Fiyatı</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="urun in filtreliurunlerNakit">
                <th class="col-2">{{ urun.saat }}</th>
                <td class="col-5">{{ urun.ad }}</td>
                <td class="col-2">{{ urun.miktar }} {{ urun.birim }}</td>
                <td class="col-3">{{ turklirasi(urun.fiyat) }}</td>
              </tr>
              </tbody>
            </table>
            <p v-else>Nakit satış yok.</p>
          </div>
        </div>
        <div class="card mt-4">
          <div class="card-header">
            <h4>POS Ürün Satışları <span v-if="rapor.urunSay.pos>0">(Toplam: {{ rapor.urunSay.pos }} ürün)</span></h4>
          </div>
          <div class="card-body">
            <table v-if="filtreliurunlerPos.length > 0" class="table">
              <thead>
              <tr>
                <th scope="col" class="col-2">Saat</th>
                <th scope="col" class="col-5">Ürün</th>
                <th scope="col" class="col-2">Miktar</th>
                <th scope="col" class="col-3">Satış Fiyatı</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="urun in filtreliurunlerPos">
                <th class="col-2">{{ urun.saat }}</th>
                <td class="col-5">{{ urun.ad }}</td>
                <td class="col-2">{{ urun.miktar }} {{ urun.birim }}</td>
                <td class="col-3">{{ turklirasi(urun.fiyat) }}</td>
              </tr>
              </tbody>
            </table>
            <p v-else>Pos satış yok.</p>
          </div>
        </div>

        <!-- İade ve Değişimler -->
        <div class="card mt-4">
          <div class="card-header">
            <h4>İadeler <span v-if="rapor.urunSay.iade>0">(Toplam: {{ rapor.urunSay.iade }} kez)</span></h4>
          </div>
          <div class="card-body">
            <table v-if="filtreliurunIadeleri.length > 0" class="table">
              <thead>
              <tr>
                <th scope="col" class="col-1">Saat</th>
                <th scope="col" class="col-4">Ürün</th>
                <th scope="col" class="col-2">Miktar</th>
                <th scope="col" class="col-2">Satış Fiyatı</th>
                <th scope="col" class="col-3">İade Nedeni</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="urun in filtreliurunIadeleri">
                <th class="col-1">{{ urun.saat }}</th>
                <td class="col-4">{{ urun.ad }}</td>
                <td class="col-2">{{ urun.miktar }} {{ urun.birim }}</td>
                <td class="col-2">{{ turklirasi(urun.fiyat) }}</td>
                <td class="col-3">{{ urun.neden }}</td>
              </tr>
              </tbody>
            </table>
            <p v-else>İade yok.</p>
          </div>
        </div>
      </div>

      <div class="col-4">
        <!-- istatistikler -->
        <div class="card mt-4">
          <div class="card-header">
            <h4>İstatistikler</h4>
          </div>
          <div class="card-body">
            <p><strong>Tarih: </strong> {{ tarih }} </p>
            <p><strong>İlk Satış: <i class="bi bi-clock"></i></strong> {{ rapor.kasaAcilis }} </p>
            <p><strong>Son Satış: <i class="bi bi-clock"></i> </strong> {{ rapor.kasaKapanis }} </p>
            <p><strong>Bugün ki Kazanç:</strong><br>
              Toplam: {{ turklirasi(rapor.toplamKazanc) }} <br>
              Nakit: {{ turklirasi(rapor.nakitKazanc) }} <br>
              Pos: {{ turklirasi(rapor.krediKazanc) }}
            </p>
            <p><strong>Toplam Müşteri:</strong> {{ rapor.musteriSayisi }} kişi</p>
            <p><strong>Ortalama Sepet Değeri:</strong> {{ turklirasi(rapor.ortalamaSepetDegeri) }}</p>
            <p><strong>Toplam İade Oluşturma:</strong> {{ rapor.iadeSayisi }} kez</p>
            <button class="btn btn-primary w-100 " @click="handlePrint">Yazdır</button>
            <button class="btn btn-secondary w-100 mt-2" @click="handlePdf">PDF Olarak Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="d-none" ref="raporDiv">
    <div class="content">
      <div class="header"><div class="d-flex justify-content-between" v-html="baslik"></div></div>
      <div class="bolmebeni">
    <strong>Özet</strong><br>
    İlk satış saat {{ rapor.kasaAcilis }} de yapıldı. Son satış saat {{ rapor.kasaKapanis }} de yapıldı.<br>
    {{ turklirasi(rapor.nakitKazanc) }} TL nakit ödeme, {{ turklirasi(rapor.krediKazanc) }} TL POS ödemesi toplam {{ turklirasi(rapor.toplamKazanc) }} kazanıldı.<br>
    {{ rapor.musteriSayisi }} ödeme açıldı, {{ rapor.iadeSayisi }} kez iade oluşturuldu.<br>
      </div>
      <div class="bolmebeni">
    <strong>Nakit Satılan Ürünler</strong>
    <table>
      <thead>
      <tr>
        <th scope="col" class="col-1">Saat</th>
        <th scope="col" class="col-6">Ürün</th>
        <th scope="col" class="col-2">Miktar</th>
        <th scope="col" class="col-3">Satış Fiyatı</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="urun in filtreliurunlerNakit">
        <th class="col-1">{{ urun.saat }}</th>
        <td class="col-6">{{ urun.ad }}</td>
        <td class="col-2">{{ urun.miktar }} {{ urun.birim }}</td>
        <td class="col-3">{{ turklirasi(urun.fiyat) }}</td>
      </tr>
      </tbody>
    </table>
      </div>

      <div class="bolmebeni">
    <strong>Pos Satılan Ürünler</strong>
    <table>
      <thead>
      <tr>
        <th scope="col" class="col-1">Saat</th>
        <th scope="col" class="col-6">Ürün</th>
        <th scope="col" class="col-2">Miktar</th>
        <th scope="col" class="col-3">Satış Fiyatı</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="urun in filtreliurunlerPos">
        <th class="col-1">{{ urun.saat }}</th>
        <td class="col-6">{{ urun.ad }}</td>
        <td class="col-2">{{ urun.miktar }} {{ urun.birim }}</td>
        <td class="col-3">{{ turklirasi(urun.fiyat) }}</td>
      </tr>
      </tbody>
    </table>
      </div>

      <div class="bolmebeni">
    <strong>İadeler</strong>
    <table>
      <thead>
      <tr>
        <th scope="col" class="col-1">Saat</th>
        <th scope="col" class="col-4">Ürün</th>
        <th scope="col" class="col-2">Miktar</th>
        <th scope="col" class="col-2">Satış Fiyatı</th>
        <th scope="col" class="col-3">İade Nedeni</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="urun in filtreliurunIadeleri">
        <th class="col-1">{{ urun.saat }}</th>
        <td class="col-4">{{ urun.ad }}</td>
        <td class="col-2">{{ urun.miktar }} {{ urun.birim }}</td>
        <td class="col-2">{{ turklirasi(urun.fiyat) }}</td>
        <td class="col-3">{{ urun.neden }}</td>
      </tr>
      </tbody>
    </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed, watch} from 'vue';
import {useStore} from "vuex";
import {trTarih, turklirasi} from "@kutuphane/index";
import {GunSonuRaporu, KisiselUrun} from "@interfaces/index";
const raporDiv = ref();
const baslik = ref<string>();
const baslikForPDF = ref<string>();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);

const handlePrint = ()=>{
  ipcRenderer.send('yazdir', baslik.value, raporDiv.value.innerHTML);
}
const handlePdf = ()=>{
  ipcRenderer.send('pdf', baslikForPDF.value, raporDiv.value.innerHTML);
}

const ipcRenderer = window.ipcRenderer;
const store = useStore();
const tarih = ref('');
const secilenTStr = ref("");
const grafikler = computed(() => store.getters["grafikDeposu/grafikler"]);
const rapor = ref<GunSonuRaporu>({
  nakitSatis: 0,
  nakitKazanc: 0,
  krediSatis: 0,
  krediKazanc: 0,
  toplamKazanc: 0,
  urunSay: {nakit:0, pos:0, iade:0},
  urunSatislari: {pos:[], nakit:[], iade:[]},
  musteriSayisi: 0,
  ortalamaSepetDegeri: 0,
  iadeSayisi: 0,
  promosyonlar: [],
  kasaAcilis: "",
  kasaKapanis: "",
  giderler: [],
  digerNotlar: '',
});
const filtreliurunlerPos= computed(() => {
  return rapor.value.urunSatislari.pos.filter(urun => urun.miktar !== 0);
});
const filtreliurunlerNakit= computed(() => {
  return rapor.value.urunSatislari.nakit.filter(urun => urun.miktar !== 0);
});
const filtreliurunIadeleri= computed(() => {
  return  rapor.value.urunSatislari.iade.filter(urun => urun.miktar !== 0);
});
const randomUrunler = computed(() => {
  const urunler = [];
  for(let i = 0; i < 100; i++){
    const urun:KisiselUrun = {
      ad: "Test Ürünü "+i,
      saat: Math.floor(Math.random() * 24)+":"+Math.floor(Math.random() * 60),
      miktar: Math.floor(Math.random() * 100),
      fiyat: Math.floor(Math.random() * 1000),
      birim: Math.random() > 0.5 ? "adet" : "kilo"
    }
    urunler.push(urun);
  }
  return urunler;
})
const islemvar = ref<boolean>(false);

onMounted(() => {
  islemvar.value = true;
  secilenTStr.value = trTarih(grafikler.value.tarih);
  tarih.value = secilenTStr.value || 'Tarih?';
  baslik.value = '<span>Gün Sonu Raporu</span>'+'<span>'+tarih.value +'</span>';
  baslikForPDF.value = tarih.value;
  if(typeof iletisim.value.ayarlar.sirket !== "undefined" && iletisim.value.ayarlar.sirket.length > 0) {
    baslik.value = "<span>"+iletisim.value.ayarlar.sirket+"</span>" + baslik.value;
    baslikForPDF.value = iletisim.value.ayarlar.sirket+" " + baslikForPDF.value;
  }

  ipcRenderer.send("rapor-getir", grafikler.value.tarih);
  ipcRenderer.on("rapor-getir-response", (event, response) => {
    rapor.value = response.veri;
    islemvar.value = false;
  });
});
watch(islemvar, (eski,yeni) => {
  if(eski == yeni) return;
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})
</script>

<style scoped>
.rapor .card h4 {
  position: relative;
  margin:0;
  padding: 0;
}

.rapor .card h4 span {
  font-size: 15px;
  position: absolute;
  bottom: 0; /* Alt hizalama */
  right: 0;  /* Sağ hizalama */
}

</style>
