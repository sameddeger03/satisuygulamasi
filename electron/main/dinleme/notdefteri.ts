import {IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {Note} from "@interfaces/index";
import {sqlTarih} from "../../../kutuphane";

export class notlar {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Not Defteri işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('not-liste', async (event:IpcMainEvent): Promise<void> => {
            this.vt.notdefteri.liste().then((liste:Note[]):void => {
                event.reply('not-liste-response', {
                    durum: true,
                    mesaj: "",
                    veri: liste
                });
            });
        });
        ipcMain.on('not-ekle', async (event:IpcMainEvent, request:Note): Promise<void> => {
            this.vt.notdefteri.ekle(request).then((id:number):void => {
                if(id > -1)
                    event.reply('not-ekle-response', {
                        durum: true,
                        mesaj: 'Not başarıyla eklendi!',
                        veri: id
                    });
                else
                    event.reply('not-ekle-response', {
                        durum: false,
                        mesaj: 'Not eklenirken bir hata oluştu.'
                    });
            })
        });
        ipcMain.on('not-sil', async (event:IpcMainEvent, id:string): Promise<void> => {
            this.vt.notdefteri.sil(id).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('not-sil-response', {
                        durum: true,
                        mesaj: 'Not başarıyla silindi!'
                    });
                else
                    event.reply('not-sil-response', {
                        durum: false,
                        mesaj: 'Not silinirken bir hata oluştu.'
                    });
            })
        });
        ipcMain.on('not-guncelle', async (event:IpcMainEvent, request:Note): Promise<void> => {
            request.tarih = sqlTarih();
            this.vt.notdefteri.guncelle(request).then((sonuc:boolean):void => {

            })
        });
    }
}