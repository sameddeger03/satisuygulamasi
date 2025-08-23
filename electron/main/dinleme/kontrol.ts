import { IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import {internet} from "../islemciler/internet";
import logger from "../logger";
import {Ayar, Cevap} from "@interfaces/index";
import vt from "../islemciler/veritabani";

export class kontrol {
    private internet: internet;
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Kontrol İşlemcisi aktifleştirildi.");
        this.internet = new internet();
        this.vt = veritabani;
        this.islemci();
    }
    cevapla(e:IpcMainEvent, responseismi:string, cevap:Cevap){
        logger(responseismi+"-response kanalına cevap gönderildi: ",cevap);
        e.sender.send(responseismi+'-response', cevap);
    }
    islemci = () => {
        ipcMain.on("kontrol.veritabani.dosyasi", (e: IpcMainEvent) => {
            logger("Veritabanı dosya kontrolü istendi.")
            this.vt.baglan().then((sonuc:boolean)=>{
                this.cevapla(e, "kontrol.veritabani.dosyasi", {durum: true, mesaj: sonuc, veri: {islem:"vt.dosya"}});
            })
        });
        ipcMain.on("kontrol.veritabani.tablosu", (e: IpcMainEvent) => {
            logger("Veritabanı tablo kontrolü istendi.")
            this.vt.tabloKontrol().then((sonuc:boolean)=>{
                this.cevapla(e, "kontrol.veritabani.tablosu", {durum: true, mesaj: sonuc, veri: {islem:"vt.tablo"}});
            })
        })
        ipcMain.on("kontrol.veritabani.tanimlama", (e: IpcMainEvent) => {
            logger("Veritabanı tanımlama kontrolü istendi.")
            this.vt.tablolaribagla().then((sonuc:boolean)=>{
                this.cevapla(e, "kontrol.veritabani.tanimlama", {durum: true, mesaj: sonuc, veri: {islem:"vt.tablo"}});
            })
        })
        ipcMain.on("internet", (e: IpcMainEvent) => {
            logger("internet bilgisi istendi. (kontrol dışı)")
            this.internet.test().then((sonuc:boolean[])=>{
                this.cevapla(e, "internet", {durum: true, mesaj: "internet", veri: {internet:sonuc[0], sunucu:sonuc[1]}});
            })
        })
        ipcMain.handle("internet", (e: IpcMainEvent) => {
            return [this.internet.sonPing(1),this.internet.sonPing(2)];
        })
        ipcMain.on("kontrol.ayarlar", (e: IpcMainEvent) => {
            logger("Ayarlar bilgisi  istendi.")
            this.vt.ayarlar.liste().then((liste:Ayar[])=>{
                const list = {};
                liste.forEach((ayar:Ayar)=>{
                    if(ayar.deger == "evet") ayar.deger = true;
                    if(ayar.deger == "hayir") ayar.deger = false;
                    list[ayar.degisken] = ayar.deger
                })
                this.cevapla(e, "kontrol.ayarlar", {durum: true, mesaj: list, veri: {islem:"ayarlar"}});
            })
        })
    }
}