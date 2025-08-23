import { IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {Odeme, Urun, Iade} from "@interfaces/index";

export class odemeler {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Ödeme işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('odeme-liste', async (event:IpcMainEvent, tarih:Date): Promise<void> => {
            this.vt.odemeler.liste(tarih).then((liste:Odeme[]):void => {
                event.reply('odeme-liste-response', {
                    durum: true,
                    mesaj: "",
                    veri: liste
                });
            });
        });
        ipcMain.on('rapor-liste', async (event:IpcMainEvent): Promise<void> => {
            this.vt.odemeler.liste().then((odemeler:Odeme[]):void => {
                this.vt.iadeler.liste().then((iadeler:Iade[]):void => {
                    event.reply('rapor-liste-response', {
                        durum: true,
                        mesaj: "",
                        veri: {odemeler, iadeler}
                    });
                });
            });
        });
        ipcMain.on('odeme-ekle', async (event:IpcMainEvent, odeme:Odeme): Promise<void> => {
            this.vt.odemeler.ekle(odeme).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('odeme-ekle-response', {
                        durum: true,
                        mesaj: 'Ödeme başarıyla kaydedildi!'
                    });
                else
                    event.reply('odeme-ekle-response', {
                        durum: false,
                        mesaj: 'Ödeme kaydedilirken bir hata oluştu.'
                    });
            });
        })
        ipcMain.on('odeme-sil', async (event:IpcMainEvent, id:string|number): Promise<void> => {
            this.vt.odemeler.sil(id).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('odeme-sil-response', {
                        durum: true,
                        mesaj: 'Ödeme Başarıyla silindi!',
                    });
                else
                    event.reply('odeme-sil-response', {
                        durum: false,
                        mesaj: 'Ödeme silinirken bir hata oluştu.'
                    });
            });
        });
        ipcMain.on('odeme-iade', async (event:IpcMainEvent, id:string|number, iadeList:Urun[], neden:string): Promise<void> => {
            this.vt.odemeler.iade(id,iadeList,neden).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('odeme-iade-response', {
                        durum: true,
                        mesaj: 'Ödeme Başarıyla iadeye düşürüldü!',
                    });
                else
                    event.reply('odeme-iptal-response', {
                        durum: false,
                        mesaj: 'Ödeme iadeye düşürüldürken bir hata oluştu.'
                    });
            });
        });

    }
}