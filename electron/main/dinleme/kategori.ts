import { BrowserWindow, IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {Kategori,Urun} from "@interfaces/index";

export class kategoriler {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Kategori işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('kategori-liste', async (event:IpcMainEvent): Promise<void> => {
            this.vt.kategoriler.liste().then((liste:Kategori[]) => {
                event.reply('kategori-liste-response', {
                    durum: true,
                    veri: liste
                });
            })
        })
        ipcMain.on("kategori-ekle", (event:IpcMainEvent, kategori:Kategori) => {
            this.vt.kategoriler.bul(kategori.isim,true).then((bul:Kategori) => {
                if(bul && !bul.sil){
                    event.reply('kategori-ekle-response', {
                        durum: false,
                        mesaj: 'Bu kategori zaten mevcut!'
                    });
                }else
                    this.vt.kategoriler.ekle(kategori).then((sonuc:boolean):void => {
                        if(sonuc)
                            event.reply('kategori-ekle-response', {
                                durum: true,
                                mesaj: 'Kategori Başarıyla eklendi!'
                            });
                        else
                            event.reply('kategori-ekle-response', {
                                durum: false,
                                mesaj: 'Kategori eklenirken bir hata oluştu.'
                            });
                    })
            });
        })
        ipcMain.on("kategori-duzenle", (event:IpcMainEvent, kategori:Kategori) => {
            this.vt.kategoriler.guncelle(kategori).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('kategori-duzenle-response', {
                        durum: true,
                        mesaj: 'Kategori Başarıyla güncellendi!',
                        veri: kategori
                    });
                else
                    event.reply('kategori-duzenle-response', {
                        durum: false,
                        mesaj: 'Kategori güncellenirken bir hata oluştu.'
                    });
            })
        })
        ipcMain.on("kategori-sil", (event:IpcMainEvent, id:string|number) => {
            this.vt.kategoriler.urunVarmi(id).then((durum:boolean) => {
                if(durum){
                    event.reply('kategori-sil-response', {
                        durum: false,
                        mesaj: 'Kategoriyi kullanan ürünler var. Önce ürünleri siliniz.'
                    });
                } else {
                    this.vt.kategoriler.sil(id).then((sonuc:boolean):void => {
                        if(sonuc)
                            event.reply('kategori-sil-response', {
                                durum: true,
                                mesaj: 'Kategori Basarıyla silindi!'
                            });
                        else
                            event.reply('kategori-sil-response', {
                                durum: false,
                                mesaj: 'Kategori silinirken bir hata oluştu.'
                            });
                    })
                }
            });
        })
    }
}