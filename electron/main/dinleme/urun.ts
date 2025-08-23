import { IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {Urun, UrunListesi} from "@interfaces/index";

export class urunler {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Ürün işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('urun-liste', async (event:IpcMainEvent, sayfa:number, filitre:Record<string, string>[], sira:Record<string, string>): Promise<void> => {
            if(!sayfa || sayfa < 1) sayfa = 1;
            this.vt.urunler.liste(sayfa,filitre, sira).then((liste:UrunListesi):void => {

                event.reply('urun-liste-response', {
                    durum: true,
                    mesaj: "Ürün listesi getirildi.",
                    veri: liste
                });
            });
        });
        ipcMain.on('urun-favs', async (event:IpcMainEvent): Promise<void> => {
            this.vt.urunler.favs().then((liste:Urun[]):void => {
                event.reply('urun-favs-response', {
                    durum: true,
                    mesaj: "Ürün fav listesi getirildi.",
                    veri: liste
                });
            });
        });
        ipcMain.on('urun-fav-degis', async (event:IpcMainEvent, id:number|string): Promise<void> => {
            console.log(id)
            const urun = await this.vt.urunler.bul(id,false, true);
            if(!urun) {
                event.reply('urun-fav-degis-response', {
                    durum: false,
                    mesaj: "Ürün bulunamadı"
                })
                return;
            }
            const durum = await this.vt.urunler.guncelle({...urun, fav: !urun.fav});
            const guncelUrun = await this.vt.urunler.bul(id, false, true);
            event.reply('urun-fav-degis-response', {
                durum,
                mesaj: "",
                veri: guncelUrun
            })
        })
        ipcMain.on('urun-ekle', async (event:IpcMainEvent, request:Urun): Promise<void> => {
            this.vt.urunler.bul(request.barkod, true, true).then((bul:Urun):void => {
                if(bul && !bul.sil) {
                    event.reply('urun-ekle-response', {
                        durum: false,
                        mesaj: 'Ürün zaten kayıtlı.'
                    });
                }else this.vt.urunler.ekle(request).then((sonuc:boolean):void => {
                    if(sonuc){
                        event.reply('urun-ekle-response', {
                            durum: true,
                            mesaj: 'Ürün başarıyla eklendi!'
                        });
                    }else {
                        event.reply('urun-ekle-response', {
                            durum: false,
                            mesaj: 'Ürün eklenirken bir hata oluştu.'
                        });
                    }
                });
            })
        });
        ipcMain.on('urun-duzenle', async (event:IpcMainEvent, request:Urun): Promise<void> => {
            this.vt.urunler.bul(request.id, false).then((urun:Urun):void => {
                this.vt.urunler.guncelle(request).then((sonuc:boolean):void => {
                    if(sonuc){
                        event.reply('urun-duzenle-response', {
                            durum: true,
                            mesaj: 'Ürün başarıyla güncellendi!',
                            veri: urun
                        });
                    }else {
                        event.reply('urun-duzenle-response', {
                            durum: false,
                            mesaj: 'Ürün güncellenirken bir hata oluştu.',
                            veri: request.id
                        });
                    }
                });
            })
        });

        ipcMain.on('urun-sil', async (event:IpcMainEvent, id:string|number): Promise<void> => {
            this.vt.urunler.sil(id).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('urun-sil-response', {
                        durum: true,
                        mesaj: 'Ürün başarıyla silindi!'
                    });
                else
                    event.reply('urun-sil-response', {
                        durum: false,
                        mesaj: 'Ürün silinirken bir hata oluştu.'
                    });
            });
        });

        ipcMain.on('urun-bul', async (event:IpcMainEvent, barkod:string): Promise<void> => {
            this.vt.urunler.bul(barkod).then((urun:Urun):void => {
                if(urun)
                    event.reply('urun-bul-response', {
                        durum: true,
                        mesaj: "Ürün bulundu.",
                        veri: urun
                    });
                else {
                    event.reply('urun-bul-response', {
                        durum: false,
                        mesaj: "Ürün bulunamadı!<br>Barkod: "+barkod,
                        veri: barkod
                    });
                }
            })
        });
    }
}