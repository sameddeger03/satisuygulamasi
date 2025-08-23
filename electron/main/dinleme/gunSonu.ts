import vt from "../islemciler/veritabani";
import {ipcMain, IpcMainEvent} from "electron";
import {sqlSaat, sqlTamTarih} from "@kutuphane/index";
import {GunSonuRaporu, Urun} from "@interfaces/index";

export class gunSonuRaporu {
    private vt:vt;
    private bosrapor:GunSonuRaporu = {
        nakitSatis: 0,
        nakitKazanc: 0,
        krediSatis: 0,
        krediKazanc: 0,
        toplamKazanc: 0,
        urunSay: {nakit:0, pos:0, iade:0},
        urunSatislari: {pos: [], nakit: [], iade:[]},
        musteriSayisi: 0,
        iadeSayisi: 0,
        ortalamaSepetDegeri: 0,
        promosyonlar: [],
        kasaAcilis: "",
        kasaKapanis: "",
        giderler: [],
        digerNotlar: '',
    };

    constructor(vt:vt){
        this.vt = vt;
        this.islemci();
    }
    async raporla(tarih:Date):Promise<GunSonuRaporu>{
        let rapor:GunSonuRaporu = this.bosrapor;
        const satislar = await this.vt.odemeler.liste(tarih);
        const iadeler = await this.vt.iadeler.liste(tarih);
        const musteriSayisi = satislar.length;
        const iadeSayisi = iadeler.length;
        let urunSay:{nakit:number, pos:number, iade:number} = {pos:0, nakit:0, iade:0};
        let toplamSatis: number;
        let nakit = 0;
        let kredi = 0;
        let nakitKazanc = 0;
        let krediKazanc = 0;
        let toplamKazanc: number;
        let urunSatislari = {pos:[], nakit:[], iade:[]};
        let sepetDegeriToplam = 0;
        let saatler = [];
        satislar.forEach(satis => {
            if (satis.iptal) return;
            if (satis.odeme) nakit += 1;
            else kredi += 1;
            saatler.push(sqlTamTarih(new Date(satis.tarih)).split(" ")[1]);
            const urunler = JSON.parse(satis.icerik);
            urunler.forEach((urun:Urun):void => {
                if(satis.odeme){
                    if(urun.birim == "adet")
                        urunSay.nakit += urun.adet;
                    else
                        urunSay.nakit++;
                    urunSatislari.nakit.push({
                        ad: urun.isim,
                        saat: sqlSaat(new Date(satis.tarih)),
                        miktar: urun.adet,
                        fiyat: urun.fiyat,
                        birim: urun.birim
                    })
                }
                else {
                    if(urun.birim == "adet")
                        urunSay.pos += urun.adet;
                    else
                        urunSay.pos++;
                    urunSatislari.pos.push({
                        ad: urun.isim,
                        saat: sqlSaat(new Date(satis.tarih)),
                        miktar: urun.adet,
                        fiyat: urun.fiyat,
                        birim: urun.birim
                    })
                }
                sepetDegeriToplam += urun.adet * urun.fiyat
            })
            if (satis.odeme) nakitKazanc += sepetDegeriToplam;
            else krediKazanc += sepetDegeriToplam;
        })

        iadeler.forEach(iade => {
            const urunler = JSON.parse(iade.icerik);
            urunSay.iade++;
            const temizListe = urunler.reduce((acc, curr) => {
                const mevcut = acc.find(item => item.id === curr.id);
                if (mevcut) {
                    mevcut.adet += 1;
                } else {
                    curr.adet = 0;
                    acc.push({ ...curr, adet: 1 });
                }
                return acc;
            }, []);
            temizListe.forEach((urun: Urun) => {
                urunSatislari.iade.push({
                    ad: urun.isim,
                    saat: sqlSaat(new Date(iade.tarih)),
                    miktar: urun.adet,
                    fiyat: urun.fiyat,
                    birim: urun.birim,
                    neden: iade.neden
                });
            });
        });



        toplamKazanc = nakitKazanc + krediKazanc;
        toplamSatis = nakit + kredi;
        let ortalamaSepetDegeri:number;
        if( toplamKazanc == 0 || musteriSayisi == 0) ortalamaSepetDegeri = 0;
        else ortalamaSepetDegeri = toplamKazanc / musteriSayisi;
        let kasaAcilis:string;
        let kasaKapanis:string;
        if(saatler.length > 1){
            const timeStamps = saatler.map(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const date = new Date(1970, 0, 1, hours, minutes);
                return date.getTime();
            });
            const minTimeStamp = Math.min(...timeStamps);
            const maxTimeStamp = Math.max(...timeStamps);
            const formatTime = (timestamp:number) => {
                const date = new Date(timestamp);
                return date.toISOString().substring(11, 19); // HH:MM:SS formatı
            };
            kasaAcilis = formatTime(minTimeStamp);
            kasaKapanis = formatTime(maxTimeStamp);
        }else if (saatler.length === 1){
            kasaAcilis = saatler[0];
            kasaKapanis = saatler[0];
        }else {
            kasaAcilis = "Hiç açılmadı.";
            kasaKapanis = "Hiç kapanmadı.";
        }

        const promosyonlar:[] = [], giderler: [] = [];

        rapor['toplamSatis'] = toplamSatis;
        rapor['toplamKazanc'] = toplamKazanc;
        rapor['nakitSatis'] = nakit;
        rapor['nakitKazanc'] = nakitKazanc;
        rapor['krediSatis'] = kredi;
        rapor['krediKazanc'] = krediKazanc;
        rapor['urunSay'] = urunSay;
        rapor['urunSatislari'] = urunSatislari;
        rapor['musteriSayisi'] = musteriSayisi;
        rapor['ortalamaSepetDegeri'] = ortalamaSepetDegeri;
        rapor['iadeSayisi'] = iadeSayisi;
        rapor['promosyonlar'] = promosyonlar;
        rapor['kasaAcilis'] = kasaAcilis;
        rapor['kasaKapanis'] = kasaKapanis;
        rapor['giderler'] = giderler;
        rapor['digerNotlar'] = '';
        return rapor;
    }

    islemci = ():void => {
        ipcMain.on('rapor-getir', async (event:IpcMainEvent, tarih:string): Promise<void> => {
            const tarih_ = new Date(tarih);
            if(!tarih_) return event.reply('rapor-getir-response', {durum: false, mesaj: "Gecersiz tarih"});
            this.raporla(tarih_).then((rapor:GunSonuRaporu):void => {
                event.reply('rapor-getir-response', {
                    durum: true,
                    mesaj: "",
                    veri: rapor
                });
            });
        });
    }

}