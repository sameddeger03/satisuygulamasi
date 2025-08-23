import { IpcMainEvent} from "electron";
import { ipcMain } from "electron";
import logger from "../logger";
import { duzgunSirketAdi } from "../yardimcilar/genel";
import vt from "../islemciler/veritabani";
import {Ayar} from "@interfaces/index";

export class ayar {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Ayar işlemcisi aktifleştirildi.");
        this.vt = veritabani;
        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on("sirket-isim", (event:IpcMainEvent,):void => {
            this.vt.ayarlar.get("sirket").then((sonuc) =>
                event.reply("sirket-isim-response", sonuc)
            );
        });
        ipcMain.on("ayar-kaydet", async (event: IpcMainEvent, ayar: Ayar): Promise<void> => {
            try {
                await this.vt.ayarlar.set(ayar.degisken, ayar.deger.toString());
                event.reply("ayar-kaydet-response",true);
            } catch (error) {
                console.error("Ayar kaydederken hata oluştu:", error, ayar);
                event.reply("ayar-kaydet-response", false);
            }
        });
        ipcMain.on("ayarlari-kaydet", async (event: IpcMainEvent, ayarlar: Ayar[]): Promise<void> => {
            try {
                for (const ayar of ayarlar) {
                    await this.vt.ayarlar.set(ayar.degisken, ayar.deger);
                }
                event.reply("ayarlari-kaydet-response",true);
            } catch (error) {
                console.error("Ayarları kaydederken hata oluştu:", error);
                event.reply("ayarlari-kaydet-response", false);
            }
        });
    }
}