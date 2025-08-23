import colorLib from '@kurkle/color';
import {DateTime} from 'luxon';
import 'chartjs-adapter-luxon';

declare interface ayObje {
    say:number,
    bolum:number
}

const AYLAR = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık'
];
export function aylar(ayar:ayObje) {
    const cfg = ayar || {say:12, bolum:3};
    const say = cfg.say;
    const bolum = cfg.bolum;
    const values = [];
    let i, value;
    for (i = 0; i < say; ++i) {
        value = AYLAR[Math.ceil(i) % 12];
        if(cfg.bolum > 0)
            values.push(value.substring(0, bolum));
        else
            values.push(value);
    }
    console.log(ayar)
    return values;
}

export function transparentize(value:string|number[], opacity:number) {
    const alpha = opacity === undefined ? 0.5 : 1 - opacity;
    return colorLib(value).alpha(alpha).rgbString();
}

export const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};


export function buyil(tarih:string,simdi:Date){
    const dateObj = new Date(tarih);
    if(!simdi) simdi = new Date();
    const yil = dateObj.getFullYear();
    return yil === simdi.getFullYear();
}
export function buay(tarih:string,simdi:Date){
    const dateObj = new Date(tarih);
    if(!simdi) simdi = new Date();
    if(!buyil(tarih,simdi)) return false;
    return (dateObj.getMonth() === simdi.getMonth());
}
export function bugun(tarih:string,simdi:Date){
    const dateObj = new Date(tarih);
    if(!simdi) simdi = new Date();
    if(!buay(tarih,simdi)) return false;
    return (dateObj.getDate() === simdi.getDate());
}
export function hangiAy(tarih:string|Date) {
    if(typeof tarih === "string") tarih = new Date(tarih);
    return tarih.getMonth()+1;
}
export function hangiYil(tarih:string|Date) {
    if(typeof tarih === "string") tarih = new Date(tarih);
    return tarih.getFullYear();
}
export function yillikVeriler(veriler:object){
    const tarih = new Date();
    let yilaGoreVeriler:Record<string, number> = {};
    for (const [tarih, deger] of Object.entries(veriler)) {
        const yil = tarih.split('.')[2];
        if (yilaGoreVeriler[yil])
            yilaGoreVeriler[yil] += deger;
        else
            yilaGoreVeriler[yil] = deger;
    }
    for(let i = tarih.getFullYear()-5; i < tarih.getFullYear(); i++)
        if(!yilaGoreVeriler[i]) yilaGoreVeriler[i] = 0;
    return yilaGoreVeriler;
}

export function aylikVeriler(veriler:object, tarih:string|Date){
    if(!tarih) tarih = new Date();
    if(typeof tarih === "string") tarih = new Date(tarih);
    let maksAy = tarih.getMonth()+1;
    let ayaGoreVeriler: Record<string, number> = {};
    for (const [tarih_, deger] of Object.entries(veriler)) {
        const yil = tarih_.split('.')[2];
        let ay = tarih_.split('.')[1];
        if (yil !== tarih.getFullYear().toString()) continue;
        if(ay.toString()[0] == "0") ay = ay.toString()[1];
        console.log(ay)
        if (ayaGoreVeriler[ay])
            ayaGoreVeriler[ay] += deger;
        else
            ayaGoreVeriler[ay] = deger;
    }
    for(let i = 1; i <= 12; i++)
        if(!ayaGoreVeriler[i] && maksAy >= i) ayaGoreVeriler[i] = 0;

    return ayaGoreVeriler;
}

export function gunlukVeriler(veriler:object, tarih:string|Date){
    if(!tarih) tarih = new Date();
    if(typeof tarih === "string") {
        tarih = new Date(tarih);
        tarih.setDate(tarih.getDate() + 1)
    }
    const simdi = new Date();
    let guneGoreVeriler:Record<string, number> = {};
    let gunSayisi = new Date(hangiYil(tarih), hangiAy(tarih), 0).getDate();
    gunSayisi++;
    for (const [tarih_, deger] of Object.entries(veriler)) {
        let [gun, ay, yil] = tarih_.split('.');
        if (yil !== tarih.getFullYear().toString()) continue;
        if(ay.toString()[0] == "0") ay = ay.toString()[1];
        if (ay !== (tarih.getMonth()+1).toString()) continue;
        if(gun.length === 2 && gun[0] === "0") gun = gun[1];
        if (guneGoreVeriler[gun])
            guneGoreVeriler[gun] += deger;
        else
            guneGoreVeriler[gun] = deger;
    }
    for(let i = 1; i <= gunSayisi; i++)
        if(!guneGoreVeriler[i] && i < gunSayisi)
            guneGoreVeriler[i] = 0;

    if(hangiAy(tarih) === (simdi.getMonth()+1))
        for(let i=simdi.getDate()+1; i<=gunSayisi; i++)
            delete guneGoreVeriler[i];
    return guneGoreVeriler//.slice(0,tarih.getDate()+1);
}

export function getMaks(veriler:object,rekor:boolean=false){
    let maks = 0;
    let enYuksekTarih = "";
    for (const [tarih, deger] of Object.entries(veriler)) {
        if(deger > maks) {
            enYuksekTarih = tarih;
            maks = deger;
        }
    }
    if(rekor) return enYuksekTarih;
    return maks;
}

export function yuzdeyap(veriler:object){
    const toplam = Object.values(veriler).reduce((a, b) => a + b, 0);
    const yuzdeler:Record<string, string> = {};
    Object.entries(veriler).forEach(([meyve, deger]) => {
        const yuzde = ((deger / toplam) * 100).toFixed(0);
        yuzdeler[meyve] = `${yuzde}%`;
    });
    return yuzdeler;
}