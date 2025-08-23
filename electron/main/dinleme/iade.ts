import { BrowserWindow, IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {Iade, Urun} from "@interfaces/index";

export class iadeler {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("İade işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('iade-liste', async (event:IpcMainEvent): Promise<void> => {
            this.vt.iadeler.liste().then((liste:Iade[]):void => {
                event.reply('iade-liste-response', {
                    durum: true,
                    mesaj: "",
                    veri: liste
                });
            });
        });
        ipcMain.on('iade-sil', async (event:IpcMainEvent, id:string|number): Promise<void> => {
            this.vt.iadeler.sil(id).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('iade-sil-response', {
                        durum: true,
                        mesaj: 'Iade Başarıyla silindi fakat ödeme iade konumunda kalmış olabilir.',
                    });
                else
                    event.reply('odeme-sil-response', {
                        durum: false,
                        mesaj: 'Iade silinirken bir hata oluştu.'
                    });
            });
        });
        ipcMain.on('iade-iptal', async (event:IpcMainEvent, id:string|number) => {
            this.vt.iadeler.iptal(id).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('odeme-iptal-response', {
                        durum: true,
                        mesaj: 'Ödeme iadesi iptal edildi!',
                    });
                else
                    event.reply('iade-iptal-response', {
                        durum: false,
                        mesaj: 'Ödeme iadesi iptal edilirken  bir hata oluştu.'
                    });
            });
        });
        ipcMain.on("iade-neden", async (event:IpcMainEvent,id:string|number): Promise<void> => {
            this.vt.iadeler.bul(id).then((iade:Iade):void => {
                if(iade)
                    event.reply('iade-neden-response', {
                        durum: true,
                        mesaj: iade.neden,
                    });
                else {
                    event.reply('iade-neden-response', {
                        durum: false,
                        mesaj: 'Iade nedeni getirilirken bir hata oluştu.'
                    });
                }
            })
        })
    }
}