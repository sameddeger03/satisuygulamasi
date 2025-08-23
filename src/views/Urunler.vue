<script setup lang="ts">
//İçe Aktarımlar
import {ref, onMounted, onUnmounted, computed, nextTick, reactive, watch} from 'vue';
import {Urun, Kategori, Cevap, UrunFiltre, Siralama, DUrun} from '@interfaces/index';
import {IpcRendererEvent} from "electron";
import {isNumeric, objele, mpen, ToLowerCaseTR} from "@kutuphane/index";
import {useStore} from "vuex";

//Tanımlamalar
const store = useStore();
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);
const urunModalTip = ref<string>("");
const islemvar = ref<boolean>(false);
const filtreliToplam = ref<number>(0);
const toplam = ref<number>(0);
const sayfaSayisi = ref<number>(0);
const sayfa = ref<number>(1);
const urunler = ref<Urun[]>([]);
const filtreler = ref<Record<string, string>[]>([]);
const base64Image = ref<string | null>(null);
const sira = ref<Siralama>({
  tip: "metin",
  ne: "isim",
  yon: "ASC"
});
const duzenlenenurun = ref<DUrun>({
  isim: "",
  barkod: "",
  fiyat: 0,
  kategori: 1,
  birim: "adet",
  imaj: ""
});
const listefiltre = reactive<UrunFiltre>({
  isim: "",
  barkod: "",
  fiyatMin: "",
  fiyatMax: "",
  kategori: "*",
  birim: "*",
  he: "*"
});

const urunKategoriler = ref<Kategori[]>([]);
const kategoriReset = ref<boolean>(true);
const ipcRenderer = window.ipcRenderer;

const urunKategorilerSirali = computed(() => {
  return urunKategoriler.value.sort((a, b) => a.isim.localeCompare(b.isim));
})

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      base64Image.value = reader.result as string;
      duzenlenenurun.imaj = base64Image.value;
    };
    reader.onerror = error => {
      store.dispatch("bildirimDeposu/ekle", { tip: "danger", mesaj: "Dosya okuma hatası." });
      console.log(error);
    };
  } else {
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: "Lütfen bir resim dosyası seçin." });
  }
};

const sayfalama = computed(() => {
  const sayfalar = [];
  const baslangic = Math.max(1, sayfa.value - 2);
  const son = Math.min(sayfaSayisi.value, sayfa.value + 2);
  for (let i = baslangic; i <= son; i++) {
    sayfalar.push(i);
  }

  return sayfalar;
});

function listeIste(){
  islemvar.value = true;
  ipcRenderer.send('urun-liste', sayfa.value.toString(), objele(filtreler.value), objele(sira.value));
}

function listele(response: Cevap) {
  if (response.durum) {
    sayfaSayisi.value = response.veri.topSayfa;
    filtreliToplam.value = response.veri.filtreliToplam;
    toplam.value = response.veri.toplam;
    urunler.value = response.veri.veriler;
  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "danger", mesaj: response.mesaj });
  islemvar.value = false;
  setTimeout(()=>{
    store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "elemanlariayarla", deger: true  });
  },100)
  urunFiltrele();
}

function urunEklendi(response: Cevap) {
  islemvar.value = false;
  if (response.durum) {
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
    listeIste();
    mpen.kapat('urunModal');
  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });

}
function urunDuzenlendi(response: Cevap) {
  islemvar.value = false;
  if (response.durum) {
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
    listeIste();
    mpen.kapat('urunModal');
  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
}

function urunEklenebilir(urun:Urun, yeni:boolean) {
  let sonuc = [];
  const uyarilar = [
    "Bu barkod numarası zaten bir ürüne ait.",
    "Bu barkod numarasına ait ürün yok.",
    "Fiyat nümerik olmalı.",
    "Fiyat sıfırdan büyük olmalı.",
    "Ürün adı 3 karakterden fazla olmalı."
  ];

  //Barkod kontrol
  if(yeni)
    sonuc.push( urunler.value.findIndex(urun_ => urun_.barkod === urun.barkod) == -1);
  else
    sonuc.push(true);
  if(!yeni)
    sonuc.push( urunler.value.findIndex(urun_ => urun_.barkod === urun.barkod) != -1);
  else
    sonuc.push(true);

  //fiyat kontrol
  sonuc.push(isNumeric(urun.fiyat));
  sonuc.push(Number(urun.fiyat) > 0);

  //isim kontrol
  sonuc.push(urun.isim.toString().length >= 3);

  sonuc.forEach((element, index) => {
    if (!element)
      store.dispatch("bildirimDeposu/ekle", { tip: "danger", mesaj: uyarilar[index] });
  })

  return sonuc.every(element => element === true);
}
function urunEkleGuncelle(urun: Urun, yeni: boolean) {
  urun.fiyat = Number(urun.fiyat.toString().replace(",","."));
  if(!urunEklenebilir(urun,yeni)) return;
  islemvar.value = true;
  urun.imaj = base64Image.value==null?"":base64Image.value;
  ipcRenderer.send(yeni?'urun-ekle':'urun-duzenle', urun);
}
function urunEkle(){
  let yeniUrun = objele(duzenlenenurun.value);
  urunEkleGuncelle(yeniUrun,true);
}
function urunDuzenle() {
  let duzenlenmisUrun = objele(duzenlenenurun.value);
  urunEkleGuncelle(duzenlenmisUrun, false);
}
function urunEkleFormDoldur() {
  urunModalTip.value = "ekle";
  nextTick(() => {
    duzenlenenurun.value = {isim: "", barkod: "", fiyat: 0, kategori: 1, birim:"adet", imaj:""};
    base64Image.value = null;
    mpen.ac("urunModal");
  });
}
function urunDuzenleFormDoldur(id: string|number) {
  urunModalTip.value = "duzenle";
  nextTick(() => {
    const bul = urunler.value.find(urun => urun.id == id);
    if(!bul) return;
    const bulunan = objele(bul);
    duzenlenenurun.value = {id: bulunan.id, isim: bulunan.isim, barkod: bulunan.barkod, fiyat: bulunan.fiyat, kategori: bulunan.kategori, birim:bulunan.birim, imaj:bulunan.imaj};
    base64Image.value = duzenlenenurun.value.imaj?duzenlenenurun.value.imaj:null;
    mpen.ac("urunModal");
  });
}
function urunSilOnay(id: string|number) {
  iletisim.value.onaymodali.onayAl('Ürün Silinecek', 'Ürünü silmek istediğinizden emin misiniz?<br><b>' + urunler.value.find(urun => urun.id == id)?.isim + '</b>', () => {
    urunSil(id);
  });
}
function urunSil(id: string|number) {
  islemvar.value = true;
  const index = urunler.value.findIndex(urun => urun.id === id);
  if (index !== -1) {
    urunler.value.splice(index, 1);
  }
  ipcRenderer.send('urun-sil', id);
}
function urunSilindi(response: Cevap) {
  if (response.durum) {
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  islemvar.value = false;
  listeIste();
}
function urunFiltrele() {
  filtreler.value = [];

  if(listefiltre.isim != "")
    filtreler.value.push({
      ne: "isim",
      nasil: "benzer",
      deger: listefiltre.isim.trim()
    });
  if(listefiltre.barkod != "")
    filtreler.value.push({
      ne: "barkod",
      nasil: "benzer",
      deger: listefiltre.barkod.trim()
    });
  if(listefiltre.fiyatMin != "")
    filtreler.value.push({
      ne: "fiyat",
      nasil: ">=",
      deger: listefiltre.fiyatMin
    });
  if(listefiltre.fiyatMax != "")
    filtreler.value.push({
      ne: "fiyat",
      nasil: "<=",
      deger: listefiltre.fiyatMax
    });
  if(listefiltre.kategori != "*")
    filtreler.value.push({
      ne: "kategori",
      nasil: "=",
      deger: listefiltre.kategori
    });
  if(listefiltre.he != "*")
    filtreler.value.push({
      ne: "fav",
      nasil: "=",
      deger: listefiltre.he
    });
  if(listefiltre.birim != "*")
    filtreler.value.push({
      ne: "birim",
      nasil: "=",
      deger: listefiltre.birim
    });
}
function filtreTemizle() {
  listefiltre.isim = "";
  listefiltre.barkod = "";
  listefiltre.fiyatMin = "";
  listefiltre.fiyatMax = "";
  listefiltre.kategori = "*";
  listefiltre.birim = "*";
  listefiltre.he = "*";
  urunFiltrele();
  filtreUygula();
}
function filtreUygula(){
  if(sayfa.value == 1) listeIste();
  else sayfa.value = 1;
}
function setKategoriler(response: Cevap) {
  if (response.durum) {
    urunKategoriler.value = response.veri;
    listeIste();
  }
  kategoriReset.value = false;
}
onMounted(() => {
  islemvar.value = true;
  ipcRenderer.on("kategori-liste-response", (event: IpcRendererEvent, response) => {setKategoriler(response)});
  ipcRenderer.on('urun-liste-response', (event: IpcRendererEvent, response) => {listele(response)});
  ipcRenderer.on('urun-duzenle-response', (event: IpcRendererEvent, response) => {urunDuzenlendi(response)});
  ipcRenderer.on('urun-ekle-response', (event: IpcRendererEvent,response) => {urunEklendi(response)});
  ipcRenderer.on('urun-sil-response', (event: IpcRendererEvent, response) => {urunSilindi(response)});
  ipcRenderer.on('urun-fav-degis-response', (event: IpcRendererEvent, response) => {urunFavDegisdi(response)});
  ipcRenderer.send('kategori-liste');
});
onUnmounted(() => {
  ipcRenderer.removeAllListeners('kategori-liste-response')
  ipcRenderer.removeAllListeners('urun-liste-response')
  ipcRenderer.removeAllListeners('urun-duzenle-response')
  ipcRenderer.removeAllListeners('urun-ekle-response')
  ipcRenderer.removeAllListeners('urun-sil-response')
})
const karatiIhtiyacTimer = ref<any>(null);
watch(islemvar, (eski,yeni) => {
  if(eski == yeni) return;
  if(false == yeni && eski == true) {
    clearTimeout(karatiIhtiyacTimer.value);
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: false });
    return;
  }
  karatiIhtiyacTimer.value = setTimeout(() => {
    store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
  },600);

})
watch(sayfa, (eski,yeni) => {
  urunler.value = [];
  listeIste();
})
function sinifGetir(ne: string, tip: string) {
  let sinif = "link";
  if (sira.value.ne === ne) {
    sinif += " link-primary";
  } else {
    sinif += " link-secondary bi bi-filter";
  }
  if (sira.value.ne === ne && sira.value.yon.toLowerCase() === "asc") {
    sinif += ` bi bi-sort-${tip}-down`;
  }
  if (sira.value.ne === ne && sira.value.yon.toLowerCase() === "desc") {
    sinif += ` bi bi-sort-${tip}-up-alt`;
  }
  return sinif;
}
function yonDegis(ne: string, tip: string) {
  sira.value.tip =  tip;
  if (sira.value.ne === ne) {
    if (sira.value.yon.toLowerCase() === "asc") {
      sira.value.yon = "desc";
    } else {
      sira.value.yon = "asc";
    }
  } else {
    sira.value.ne = ne;
    sira.value.yon = "asc";
  }
  urunler.value = [];
  listeIste();
}
function favDurumDegis(urun: Urun) {
  islemvar.value = true;
  ipcRenderer.send('urun-fav-degis', urun.id);
}
function urunFavDegisdi(response: Cevap) {
  if (response.durum) {
    const index = urunler.value.findIndex(urun => urun.id === response.veri.id);
    if (index !== -1) {
      urunler.value[index].fav = response.veri.fav;
    }
  }
  setTimeout(()=>{
    store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "elemanlariayarla", deger: true  });
  },100)
  islemvar.value = false;
}
</script>
<template>
  <div class="d-flex justify-content-between align-items-center">
    <h2>Ürün Listesi</h2>
    <button
        class="btn btn-primary"
        aria-controls="yeniUrunEkle"
        @click="urunEkleFormDoldur"

    >
      Yeni Ürun Ekle
    </button>
  </div>
  <div class="border p-2" >
    <div class="d-flex justify-content-between align-items-center mb-1">
      <input @keyup="urunFiltrele" v-model="listefiltre.isim"  type="text" class="form-control me-2" placeholder="Ürün adı" />
      <input @keyup="urunFiltrele" v-model="listefiltre.barkod"  type="text" class="form-control me-2" placeholder="Barkod" />
    </div>
    <div class="d-flex justify-content-between align-items-center">
      <select @change="urunFiltrele" v-model="listefiltre.kategori"  class="form-select me-2">
        <option value="*" selected>Tüm Kategoriler</option>
        <option v-for="k in urunKategoriler" :key="k.id" :value="k.id">{{k.isim}}</option>
      </select>
      <select @change="urunFiltrele" v-model="listefiltre.he"  class="form-select me-2">
        <option value="*" selected>Tüm Özellikler</option>
        <option value="1">Hızlı Erişim</option>
      </select>

      <select @change="urunFiltrele" v-model="listefiltre.birim"  class="form-select me-2">
        <option value="*" selected>Tüm Birimler</option>
        <option value="adet" selected>Adet</option>
        <option value="kilo" selected>Kilo</option>
      </select>
      <input @keyup="urunFiltrele" v-model="listefiltre.fiyatMin" min="0"  type="number" step="0.01" class="form-control me-2" placeholder="Min. Fiyat" />
      <input @keyup="urunFiltrele" v-model="listefiltre.fiyatMax"  min="0" type="number" step="0.01" class="form-control me-2" placeholder="Max. Fiyat" />
      <button  class="btn btn-success me-2" @click="filtreUygula" data-bs-toggle="tooltip" data-bs-placement="top" title="Filitreyi uygula"><i class="bi bi-funnel-fill"></i></button>
      <button  class="btn btn-warning " @click="filtreTemizle" data-bs-toggle="tooltip" data-bs-placement="top" title="Filtreyi temizle"><i class="bi bi-eraser "></i></button>
    </div>
  </div>

  <div style="max-height: calc(100% - 178px); height: calc(100% - 220px);">
    <div v-if="islemvar" class="alert alert-warning mt-2">
      Tablo güncelleniyor...
    </div>
    <div v-else-if="!toplam" class="alert alert-danger mt-2">
      Hiç ürün kaydedilmemiş.
    </div>
    <div v-else-if="!urunler.length" class="alert alert-danger mt-2">
      filtreye uygun ürün yok.
    </div>

    <div v-else class="overflow-auto mt-3 h-100" style="max-height: 100%;">
      <table  class="table table-striped table-bordered table-sm">
        <thead>
        <tr>
          <th >#</th>
          <th scope="col" class="col-1">Kategori </th>
          <th scope="col" class="col-4">Ürün Adı <i @click="yonDegis('isim', 'metin')" :class="sinifGetir('isim','alpha')"></i></th>
          <th scope="col" class="col-3">Barkod <i @click="yonDegis('barkod', 'sayi')" :class="sinifGetir('barkod','numeric')"></i></th>
          <th scope="col" class="col-2">Birim</th>
          <th scope="col" class="col-2">Fiyat <i @click="yonDegis('fiyat', 'sayi')" :class="sinifGetir('fiyat','numeric')"></i></th>
          <th scope="col" class="col-1">İşlem</th>
        </tr>
        </thead>
        <tbody >
        <tr v-for="urun in urunler">
          <td>
            <span data-bs-toggle="tooltip" data-bs-placement="top" :title="urun.fav?'Hızlı erişimden kaldır':'Hızlı erişime ekle'">
            <i style="cursor: pointer" @click="favDurumDegis(urun)" :class="urun.fav?'bi bi-star-fill':'bi bi-star'"></i>
            </span>
          </td>
          <td>{{urun.kategori_isim}}</td>
          <td>{{urun.isim}}</td>
          <td>{{urun.barkod}}</td>
          <td>{{urun.birim}}</td>
          <td>{{urun.fiyat}} ₺</td>
          <td class="">
            <div class="d-flex justify-content-center align-items-center">
              <button class="svg-btn mx-1 btn col-md-6 btn-success" @click="() => urunDuzenleFormDoldur(urun.id)" data-bs-toggle="tooltip" data-bs-placement="top" title="Ürünü Düzenle" >
                <i class="bi bi-pencil"></i>
              </button>
              <button class="svg-btn mx-1 btn col-md-6  btn-danger" @click="() => urunSilOnay(urun.id)" data-bs-toggle="tooltip" data-bs-placement="top" title="Ürünü Sil">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>

    </div>
  </div>
  <div v-if="!islemvar" class="mt-3 alert alert-secondary p-1 d-flex justify-content-between align-items-center" style="height: 48px">
    <div>
      Toplam {{toplam}} ürün var. <span v-if="filtreliToplam!=toplam">Filtre sonrası {{toplam-filtreliToplam}} tanesi listeleniyor.</span> Bu sayfada {{urunler.length}} tanesi gösteriliyor.
    </div>
    <nav class="mt-3 float-end align-content-end">
      <ul class="pagination">
        <li class="page-item" :class="sayfa == 0 ? 'disabled' : ''">
          <button @click="sayfa = 1" class="page-link" aria-label="Previous" :disabled="sayfa == 1">
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>

        <li class="page-item" v-for="sayfaNum in sayfalama" :key="sayfaNum" :class="sayfa == sayfaNum ? 'active' : ''"
        >
          <button class="page-link" @click="sayfa = sayfaNum" :disabled="sayfaNum === sayfa">
            {{ sayfaNum }}
          </button>
        </li>

        <li class="page-item">
          <button @click="sayfa = sayfaSayisi" class="page-link" href="#" aria-label="Next" :disabled="sayfa == sayfaSayisi">
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>

  <div class="modal" tabindex="-1" id="urunModal" >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 v-if="urunModalTip=='ekle'" class="modal-title" id="urunEkleModalLabel">Yeni Ürün Ekle</h5>
          <h5 v-if="urunModalTip=='duzenle'" class="modal-title" id="urunDuzenleModalLabel"> <span class="w-100">Ürün Güncelleme</span> <span class="text-primary fs-6">{{ duzenlenenurun?.isim }}</span></h5>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Ürün Adı</label>
            <input v-model="duzenlenenurun.isim" type="text" class="form-control me-2"  />
          </div>
          <div class="mb-3">
            <label class="form-label">Barkod Numarası</label>
            <input v-model="duzenlenenurun.barkod" type="text" class="form-control me-2"  />
          </div>
          <div class="mb-3">
            <label class="form-label">Ürün Kategorisi</label>
            <select v-if="!kategoriReset" v-model="duzenlenenurun.kategori" class="form-control me-2" >
              <option v-for="urunKategori in urunKategorilerSirali" :value="urunKategori.id" :selected="urunKategori.id == duzenlenenurun.kategori">{{urunKategori.isim}}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Birimi</label>
            <select  v-model="duzenlenenurun.birim" class="form-control me-2" >
              <option value="adet">Adet</option>
              <option value="kilo">Kilogram</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Fiyatı</label>
            <div class="input-group">
              <span class="input-group-text">₺</span>
              <input v-model="duzenlenenurun.fiyat" type="number" step="0.01" class="form-control me-2" placeholder="Fiyat" @keyup.enter="()=>{urunModalTip=='ekle'?urunEkle():urunDuzenle()}" />
            </div>
          </div>
          <div class="mb-3 row">
            <div class="col-4">
              <img :src="base64Image?base64Image:'data:image/jpeg;base64,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AB3nTwAAAAAABcAAAAAAAD1/PngAAAAAAO86eAAAAAAALgAAAAAAATmvgAAAAAAOwdtAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAVIAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC4AAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAuAAAAAAAAAAAAAAAAAAAAAABcAAAAAAAAAAAAAAAAAAAAAAC//8QA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'" width="100%" />
            </div>
            <div class="col-8">
            <label class="form-label">Ürün Görseli</label>
            <input type="file" class="form-control me-2" @change="handleFileChange" />
              <div class="form-text">
                Seçeceğiniz dosya PNG, JPG ya da BMP formatında olmalıdır. Önerilen boyut 400x400 pikseldir.
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="()=>{mpen.kapat('urunModal'); urunModalTip = ''}">Vazgeç</button>
          <button v-if="urunModalTip=='ekle'" class="btn btn-primary"  @click="urunEkle" >Oluştur</button>
          <button v-if="urunModalTip=='duzenle'" class="btn btn-primary"  @click="urunDuzenle" >Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.link {
  cursor: pointer;
}
</style>



