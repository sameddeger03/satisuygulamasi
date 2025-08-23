<script setup lang="ts">
import {ref, onMounted, onUnmounted, computed, watchEffect, watch, nextTick} from 'vue';
import * as kutuphane from "@kutuphane/index"
import {Odeme, Cevap, Urun} from "@interfaces/index";
import {mpen, sqlTarih, sqlTarihSaatsiz, ToLowerCaseTR, turklirasi, uidolustur} from "@kutuphane/index";
import {useStore} from "vuex";
import {Modal} from "bootstrap";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const store = useStore();

const odemeler = ref<Odeme[]>([]);
const odemebos = computed(() => odemeler.value.length <= 0);
const islemvar = ref<boolean>(false);
const iptalID = ref<number>(0)
const iptalNeden = ref<string>('');
const iptalSadeceGoruntule = ref<boolean>(false);
const icerikFInput = ref<HTMLInputElement | null>(null);
const kazancMinFInput = ref<HTMLInputElement | null>(null);
const kazancMaxFInput = ref<HTMLInputElement | null>(null);
const odemeTurFInput = ref<HTMLSelectElement | null>(null);
const secilenTarih = ref<Date>(new Date());
const ipcRenderer = window.ipcRenderer;
const filteredItems = computed(() => {
  return odemeler.value.filter(odeme => !odeme.gizle);
});
const urunlist = ref<Urun[]>([]);
const iadelist = ref<Urun[]>([]);
const iletisim = computed(() => store.getters["iletisimDeposu/iletisim"]);

const odemeFiltrele = () => {
  islemvar.value = true;
  const icerik = icerikFInput.value?.value || '';
  const minkazanc = kazancMinFInput.value?.value || '';
  const maxkazanc = kazancMaxFInput.value?.value || '';
  const odemeTur = odemeTurFInput.value?.value || '';
  odemeler.value.forEach((odeme, index) => {

    odemeler.value[index].gizle = icerik.length > 0 && ToLowerCaseTR(odeme.icerik).indexOf(ToLowerCaseTR(icerik)) === -1;
    if (minkazanc.length > 0 && odeme.kazanc < +minkazanc)
      odemeler.value[index].gizle = true;
    if (maxkazanc.length > 0 && odeme.kazanc > +maxkazanc)
      odemeler.value[index].gizle = true;
    if (odeme.sil)
      odemeler.value[index].gizle = true;
    if(odemeTur == "2" && !odeme.odeme)
      odemeler.value[index].gizle = true;
    if(odemeTur == "3" && odeme.odeme)
      odemeler.value[index].gizle = true;
  });
  islemvar.value = false;
};

function filtreTemizle() {
  if (icerikFInput.value) icerikFInput.value.value = '';
  if (kazancMinFInput.value) kazancMinFInput.value.value = '';
  if (kazancMaxFInput.value) kazancMaxFInput.value.value = '';
  odemeFiltrele();
}

function listele(response: Cevap) {
  if (response.durum && response.veri) {
    response.veri.forEach((odeme: Odeme, index: number) => {
      odeme.gizle = false;
      const getJson = JSON.parse(odeme.icerik);
      const urunler:Urun[] = [];
      getJson.forEach((urun:Urun) => {
        urunler.push(urun);
      });
      odeme.kazanc = 0;
      odeme.metin = "";
      urunler.forEach((urun:Urun) => {
        if(urun.birim == "kilo") {
          if(!urun.iade) urun.iade = 0;
          if(urun.adet + urun.iade < 1) {
            urun.adet *= 1000;
            urun.iade *= 1000;
            urun.birim = "gram";
            urun.fiyat  = urun.fiyat/1000;
          }
        }
        if(urun.iade == 0) {
        response.veri[index].metin += `
<span class="alert alert-success position-relative fs-6 " style="width: fit-content; ">
  <span class=" h-100">${urun.isim}</span>
  <div class="position-absolute w-100 top-0 start-0 translate-middle-y d-flex justify-content-center">
    <span class=" badge rounded-pill bg-success ">
      ${urun.adet} ${urun.birim}
    </span>
  </div>
</span>`;
        } else if(urun.adet == 0) {
          response.veri[index].metin += `
<span class="alert alert-danger position-relative fs-6 " style="width: fit-content; ">
  <span class=" h-100">${urun.isim}</span>
  <div class="position-absolute w-100 top-0 start-0 translate-middle-y d-flex justify-content-center">
  <span class=" badge rounded-pill bg-danger ">
    ${urun.iade} ${urun.birim}
  </span>
  </div>
</span>`;
        }else {
          response.veri[index].metin += `
<span class="alert alert-warning position-relative fs-6 " style="width: fit-content; ">
  <span class=" h-100">${urun.isim}</span>
  <div class="position-absolute w-100 top-0 start-0 translate-middle-y d-flex justify-content-between">
    <span  class="badge rounded-pill bg-success ">
      ${urun.adet}  ${urun.birim}
    </span>
     <span class="badge rounded-pill bg-danger ">
      ${urun.iade}  ${urun.birim}
    </span>
  </div>
</span>`;
        }
        odeme.kazanc += urun.fiyat * urun.adet;
      });
      if(odeme.kazancStr == null) odeme.kazancStr = "";
      odeme.kazancStr += turklirasi(odeme.kazanc);
    });
    odemeler.value = response.veri;
    odemeFiltrele();
  } else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });
  setTimeout(()=>{
    store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "elemanlariayarla", deger: true  });
  },100)
  islemvar.value = false;
}

function odemeSil_onay(id: number) {
  iptalID.value = id;
  if(iletisim.value.onaymodali)
    iletisim.value.onaymodali.onayAl(
        t('payments.deleteConfirm'),
        '<div class="alert alert-danger  p-1" role="alert">\n' +
        '  <div class="d-flex align-items-center gap-1 border border-danger rounded p-1"><i class="bi bi-exclamation-triangle-fill"/></i> <span>' + t('payments.deleteWarning') + '</span></div>\n' +
        '</div>' +
        t('payments.deleteMessage'),
        odemeSil);
}

function odemeSil() {
  islemvar.value = true;
  const index = odemeler.value.findIndex(odeme => odeme.id === iptalID.value);
  if (index !== -1) {
    odemeler.value.splice(index, 1);
  }
  ipcRenderer.send('odeme-sil', iptalID.value);
  iptalID.value = 0;
}

function odemeSilindi(response: Cevap) {
  if (response.durum)
    store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
  else
    store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });

  islemvar.value = false;
  ipcRenderer.send('odeme-liste', secilenTarih.value);
}

function odemeIade(id: number, index: number) {
  islemvar.value = true;
  nextTick(() => {
    iptalID.value = id;
    iptalNeden.value = "";
    iptalSadeceGoruntule.value = false;
    const liste = JSON.parse(filteredItems.value[index].icerik)
    urunlist.value = [];
    iadelist.value = [];
    liste.forEach((urun: Urun) => {
      if (urun.birim == "adet")
        for (let i = 0; i < urun.adet; i++) {
          const yeniUrun = JSON.parse(JSON.stringify(urun));
          yeniUrun.uid = uidolustur();
          urunlist.value.push(yeniUrun);
        }
      else {
        if (urun.iade == 0) {
          const yeniUrun = JSON.parse(JSON.stringify(urun));
          yeniUrun.uid = uidolustur();
          urunlist.value.push(yeniUrun);
        }
      }
    })
    islemvar.value = false;
    mpen.ac('nedenModal');
  });
}

function iadeOnay() {
  iletisim.value.onaymodali.onayAl(
      t('payments.refundTitle2'),
      t('payments.refundConfirm'),
      () => {
        iadeOlustur();
      });
}

function iadeOlustur(){
  islemvar.value = true;
  ipcRenderer.send('odeme-iade', iptalID.value, JSON.parse(JSON.stringify(iadelist.value)), iptalNeden.value);
}

onMounted(() => {
  secilenTarih.value = (iletisim.value.odemeListesiTarih) as Date || new Date();
  ipcRenderer.on('odeme-liste-response', (event, response: Cevap) => { listele(response); });
  ipcRenderer.on('odeme-sil-response', (event, response: Cevap) => { odemeSilindi(response); });
  ipcRenderer.on('odeme-iade-response', (event, response: Cevap) => {
    if (response.durum) {
      store.dispatch("bildirimDeposu/ekle", { tip: "success", mesaj: response.mesaj });
      mpen.kapat('nedenModal');
      ipcRenderer.send('odeme-liste',secilenTarih.value);
    }else
      store.dispatch("bildirimDeposu/ekle", { tip: "warning", mesaj: response.mesaj });

    islemvar.value = false;
  });
  ipcRenderer.send('odeme-liste', secilenTarih.value);
});

onUnmounted(() => {
  ipcRenderer.removeAllListeners('odeme-liste-response');
  ipcRenderer.removeAllListeners('odeme-sil-response');
  ipcRenderer.removeAllListeners('odeme-iade-response');
});

watch(islemvar, (eski,yeni) => {
  store.dispatch('iletisimDeposu/veriKaydet', { degisken: 'beklet', deger: !yeni });
})

function hepsinisec(listId:string, checked:boolean) {
  const items:NodeListOf<HTMLInputElement> = document.querySelectorAll(`#${listId} .list-group-item input[type="checkbox"]`);
  if(items && items.length>0)
  items.forEach((item:HTMLInputElement) => {
    item.checked = checked;
  });
}

function yerDegistir(nerden:string, nereye:string) {
  const sourceList = nerden === 'urunler' ? urunlist : iadelist;
  const targetList = nereye === 'urunler' ? urunlist : iadelist;
  const checkboxes:NodeListOf<HTMLInputElement> = document.querySelectorAll(`#${nerden} .list-group-item:not(.active) input[type="checkbox"]:checked`);
  checkboxes.forEach((checkbox:HTMLInputElement) => {
    const a = checkbox.closest('a');
    if(!a) return;
    const listItem = a.dataset.uid;
    const item = sourceList.value.find(eleman => eleman.uid === listItem);
    if (item) {
      targetList.value.push(item);
      sourceList.value = sourceList.value.filter(eleman => eleman.uid !== item.uid);
    }
  });
  const allCheckboxes:NodeListOf<HTMLInputElement> = document.querySelectorAll(`#${nerden} .list-group-item input[type="checkbox"], #${nereye} .list-group-item input[type="checkbox"]`);
  allCheckboxes.forEach((checkbox:HTMLInputElement) => {
    checkbox.checked = false;
  });
}

function secimalani(neresi:string){
  if (neresi === 'urunler')
    neresi = 'iadeler';
  else
    neresi = 'urunler';
  const checkboxes:NodeListOf<HTMLInputElement> = document.querySelectorAll(`#${neresi} .list-group-item input[type="checkbox"]:checked`);
  checkboxes.forEach((checkbox:HTMLInputElement) => {
    checkbox.checked = false;
  });
}

function tarihDegisti(e:Event){
  islemvar.value = true;
  secilenTarih.value = new Date((e.target as HTMLInputElement).value);
  store.dispatch("iletisimDeposu/veriKaydet", {  degisken: "odemeListesiTarih", deger: secilenTarih.value  });
  ipcRenderer.send('odeme-liste',secilenTarih.value);
}
</script>

<template>
  <div class="d-flex justify-content-between align-items-center">
    <h2>{{ $t('payments.title') }} </h2>
  </div>
  <div class="border p-2" >
    <div class="d-flex justify-content-between align-items-center">
      <input type="date" class="form-control me-2"
        @change="tarihDegisti" :value="sqlTarihSaatsiz(secilenTarih)" :max="sqlTarihSaatsiz(new Date())"  />
      <select ref="odemeTurFInput" :disabled="islemvar" class="form-select  me-2" @change="odemeFiltrele">
        <option selected value="1">{{ $t('payments.all') }}</option>
        <option value="2">{{ $t('payments.cashPayment') }}</option>
        <option value="3">{{ $t('payments.cardPayment') }}</option>
      </select>
      <input @keyup="odemeFiltrele" ref="icerikFInput" :disabled="islemvar" type="text" class="form-control me-2" :placeholder="$t('payments.searchPlaceholder')" />
      <input @keyup="odemeFiltrele" ref="kazancMinFInput" :disabled="islemvar" type="number" step="0.01" class="form-control me-2" :placeholder="$t('payments.minEarning')" />
      <input @keyup="odemeFiltrele" ref="kazancMaxFInput" :disabled="islemvar" type="number" step="0.01" class="form-control me-2" :placeholder="$t('payments.maxEarning')" />
      <button :disabled="islemvar" class="btn btn-primary" @click="filtreTemizle">{{ $t('common.clear') }}</button>
    </div>
  </div>

  <div v-if="odemebos" class="alert alert-danger mt-2">
    {{ $t('payments.noPayments') }}
  </div>
  <div v-else class="overflow-auto mt-3" style="max-height:85%">
    <table  class="table table-striped table-bordered table-sm">
      <thead>
      <tr>
        <th scope="col" style="width: 3%">{{ $t('payments.type') }}</th>
        <th scope="col" style="width: 60%">{{ $t('payments.containedProducts') }}</th>
        <th scope="col" style="width: 20%">{{ $t('payments.recordTime') }}</th>
        <th scope="col" style="width: 10%">{{ $t('payments.earning') }}</th>
        <th scope="col" style="width: 5%">{{ $t('categories.action') }}</th>
      </tr>
      </thead>
      <tbody >
      <tr v-for="(odeme,index) in filteredItems" :class="odeme.iptal?'table-danger':'table-white'">
        <td class="align-middle text-center"  >
          <span data-bs-toggle="tooltip" data-bs-placement="top" :title="odeme.odeme?$t('payments.cashPayment'):$t('payments.cardPayment')" :class="odeme.odeme?'text-success':'text-info'">
            <i v-if="odeme.odeme" class="bi bi-cash-coin"></i>
            <i v-else class="bi bi-credit-card"></i>
          </span>
        </td>
        <td  class="align-middle"><div class="row m-0 mt-2 gap-2" v-html="odeme.metin"></div></td>
        <td v-html="kutuphane.tarihFormatla(odeme.tarih,'br')" class="align-middle"></td>
        <td class="fs-5 align-middle text-center">{{odeme.kazancStr}}</td>
        <td class="align-middle">
          <div class="d-flex justify-content-center align-items-center">
            <button class="svg-btn mx-1  btn col-md-6  btn-warning" @click="() => odemeIade(odeme.id, index)">
              <i class="bi bi-x-circle"></i>
            </button>
            <button class="svg-btn mx-1 btn col-md-6  btn-danger" @click="() => odemeSil_onay(odeme.id)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
  <div class="modal" tabindex="-1" id="nedenModal">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ $t('payments.refundTitle') }}</h5>
        </div>
        <div class="modal-body">
          <p>{{ $t('payments.refundReason') }} </p>
          <textarea  class="form-control" v-model="iptalNeden" ></textarea>
          <div class="row my-4">
            <div class="col-12 d-flex align-items-center justify-content-center p-2 fs-5">{{ $t('payments.selectProducts') }}</div>
            <div class="col-5">
              <div class="list-group" id="urunler">
                <a class="list-group-item active">{{ $t('payments.paidProducts') }} <input :title="$t('payments.selectAll')" type="checkbox" @change="(event)=>{if(event.target) hepsinisec('urunler', (event.target as HTMLInputElement).checked)}" class="float-end"></a>
                <a v-if="!urunlist.length" class="list-group-item">{{ $t('payments.noRefundableProducts') }}</a>
                <a class="list-group-item" v-for="urun in urunlist" :key="urun.uid" :data-uid="urun.uid">{{urun.isim}}<input @change="()=>{secimalani('urunler')}" type="checkbox" class="float-end"></a>
              </div>
            </div>
            <div class="col-2 d-flex flex-column justify-content-center gap-3">
              <button :title="$t('payments.createRefund')" class="btn btn-primary" @click="yerDegistir('urunler','iadeler')"><i class="bi bi-arrow-right"></i></button>
              <button :title="$t('common.back')" class="btn btn-primary" @click="yerDegistir('iadeler','urunler')"><i class="bi bi-arrow-left"></i></button>
            </div>
            <div class="col-5">
              <div class="list-group" id="iadeler">
                <a class="list-group-item active">{{ $t('payments.refundProducts') }} <input :title="$t('payments.selectAll')" type="checkbox" @change="(event)=>{if(event.target) hepsinisec('iadeler', (event.target as HTMLInputElement).checked)}" class="float-end"></a>
                <a v-if="iadelist.length==0" class="list-group-item">{{ $t('payments.addProducts') }}</a>
                <a class="list-group-item" v-for="urun in iadelist" :key="urun.uid" :data-uid="urun.uid">{{urun.isim}}<input @change="()=>{secimalani('urunler')}" type="checkbox" class="float-end"></a>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="()=>{mpen.kapat('nedenModal')}">{{ $t('common.cancel') }}</button>
          <button :disabled="iadelist.length==0" type="button" class="btn btn-danger" @click="iadeOnay" >{{ $t('payments.createRefund') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
