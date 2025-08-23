import { IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {ckUrun, ckOdeme, ckKategori, ckListe, ckObje} from "@interfaces/index";

export class copkutusu {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Cop kutusu islemcisi aktiflestirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('ck-liste', async (event:IpcMainEvent): Promise<void> => {
            this.vt.ck.liste().then((liste:ckListe):void => {
                event.reply('ck-liste-response', {
                    durum: true,
                    mesaj: "Çöp kutusu listesi getirildi.",
                    veri: liste
                });
            });
        });

        ipcMain.on('ck-kurtar', async (event:IpcMainEvent, gelen:ckObje): Promise<void> => {
            const {id, tablo} = gelen;
            this.vt.ck.kurtar(id,tablo).then((sonuc:boolean):void => {
                logger("Kurtarma islemi: "+id+" | "+tablo+" :"+sonuc);
                if(sonuc){
                    event.reply('ck-kurtar-response', {
                        durum: true,
                        mesaj: 'Geri dönüşüm sağlandı!',
                        veri: [tablo,id]
                    });
                }else {
                    event.reply('ck-kurtar-response', {
                        durum: false,
                        mesaj: 'Geri dönüşüm sağlanamadı!',
                        veri: [tablo,id]
                    });
                }
            });
        });

        ipcMain.on('ck-sil', async (event:IpcMainEvent, gelen:ckObje): Promise<void> => {
            const {id, tablo} = gelen;
            this.vt.ck.kurtar(id,tablo).then((sonuc:boolean):void => {
                if(sonuc){
                    event.reply('ck-sil-response', {
                        durum: true,
                        mesaj: 'Eleman tamamen silindi!',
                        veri: [tablo,id]
                    });
                }else {
                    event.reply('ck-sil-response', {
                        durum: false,
                        mesaj: 'Eleman silinirken bir hata oluştu.',
                        veri: [tablo,id]
                    });
                }
            });
        });
    }
}