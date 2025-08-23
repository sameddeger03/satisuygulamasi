import {IpcMainEvent} from "electron";
import { ipcMain, BrowserWindow } from "electron";
import logger from "../logger";
import vt from "../islemciler/veritabani";
import {Hatirlatma, Planlama, Plan} from "@interfaces/index";

function alarmlariilet(vt,tarih:Date):void {
    vt.planlama.liste(tarih,"alarm").then((liste:Hatirlatma[]):void => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('alarmlar-response', {
                durum: true,
                mesaj: "",
                veri: liste
            });
        });
    });
}

export class planlar {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Planlama işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on('planlamalar', async (event:IpcMainEvent, tarih:Date): Promise<void> => {
            this.vt.planlama.liste(tarih).then((liste:Planlama):void => {
                event.reply('planlamalar-response', {
                    durum: true,
                    mesaj: "",
                    veri: liste
                });
                alarmlariilet(this.vt,tarih);
            });
        });
        ipcMain.on('alarm-ekle', async (event:IpcMainEvent, request:Hatirlatma): Promise<void> => {
            this.vt.planlama.ekle(request).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('alarm-ekle-response', {
                        durum: true,
                        mesaj: 'Alarm başarıyla eklendi!'
                    });
                else
                    event.reply('alarm-ekle-response', {
                        durum: false,
                        mesaj: 'Alarm eklenirken bir hata olustu.'
                    });
                alarmlariilet(this.vt, new Date());
            })
        });
        ipcMain.on('alarm-sil', async (event:IpcMainEvent, id:string): Promise<void> => {
            this.vt.planlama.sil(id,"alarm").then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('alarm-sil-response', {
                        durum: true,
                        mesaj: 'Alarm başarıyla silindi!'
                    });
                else
                    event.reply('alarm-sil-response', {
                        durum: false,
                        mesaj: 'Alarm silinirken bir hata oluştu.'
                    });
                alarmlariilet(this.vt, new Date());
            })

        });
        ipcMain.on("alarmlar", async (event:IpcMainEvent, tarih:Date|null=null): Promise<void> => {
            alarmlariilet(this.vt,tarih);
        })
        ipcMain.on("alarmUyar", async (event:IpcMainEvent, id:string|number, eylem:boolean): Promise<void> => {
            this.vt.planlama.alarmUyar(id,eylem).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply("alarmUyar-response", {
                        durum: true,
                        mesaj: "Alarm başarıyla "+(eylem?"acildi":"kapatildi")+"!"
                    });
                else
                    event.reply("alarmUyar-response", {
                        durum: false,
                        mesaj: "Alarm "+(eylem?"acilirken":"kapatilirken")+" bir hata olustu."
                    });
                alarmlariilet(this.vt,new Date());
            })
        })

        ipcMain.on('plan-ekle', async (event:IpcMainEvent, request:Plan): Promise<void> => {
            this.vt.planlama.ekle(request).then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('plan-ekle-response', {
                        durum: true,
                        mesaj: 'Plan başarıyla eklendi!'
                    });
                else
                    event.reply('alarm-ekle-response', {
                        durum: false,
                        mesaj: 'Plan eklenirken bir hata oluştu.'
                    });
                alarmlariilet(this.vt, new Date());
            })
        });
        ipcMain.on('plan-sil', async (event:IpcMainEvent, id:string): Promise<void> => {
            this.vt.planlama.sil(id,"plan").then((sonuc:boolean):void => {
                if(sonuc)
                    event.reply('plan-sil-response', {
                        durum: true,
                        mesaj: 'Plan başarıyla silindi!'
                    });
                else
                    event.reply('plan-sil-response', {
                        durum: false,
                        mesaj: 'Plan silinirken bir hata oluştu.'
                    });
            })

        });
        ipcMain.on("plan-yapildi", async (event:IpcMainEvent, id:string|number, eylem:boolean): Promise<void> => {
            await this.vt.planlama.planDurum(id,eylem);
        })
    }
}