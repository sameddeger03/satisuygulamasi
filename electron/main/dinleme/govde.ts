import {App, BrowserWindow} from "electron";
import { ipcMain, shell } from "electron";
import logger from "../logger";
import {processManager} from "../yardimcilar/hesapmak";
import fs from "node:fs";
export class govde {
    constructor(pencere: BrowserWindow, uygulama:App) {
        logger("Gövde İşlemci aktifleştirildi.");
        this.islemci(pencere,uygulama);
    }
    islemci = (mainWindow: BrowserWindow, uygulama:App) => {
        ipcMain.on("yenile", () => {
            //uygulamayiBaslat();
        });
        ipcMain.on("onegetir", () => {
            mainWindow.resizable = true;
            mainWindow.maximize();
            mainWindow.focus();
            mainWindow.resizable = false;
        })
        ipcMain.on("kucult", () => {
            mainWindow.resizable = true;
            mainWindow.minimize();
            mainWindow.resizable = false;
        });
        ipcMain.on("tamekran", () => {
            mainWindow.resizable = true;
            mainWindow.maximize();
            mainWindow.setFullScreen(true);
            mainWindow.resizable = false;
        });
        ipcMain.on("tamekran-cik", () => {
            mainWindow.maximize();
            mainWindow.setFullScreen(false);
            mainWindow.resizable = false;
        });
        ipcMain.on("yeniden-baslat", () => {
            //yenidenbaslat();
        })
        ipcMain.on("kapat", () => {
            uygulama.quit();
            uygulama.exit();
        })
        ipcMain.on("cikis-yap", () => {
            //kurulum.sifirla();
            //yenidenbaslat();
        })
        ipcMain.on("stdout", (event, message) => {
            console.log(message)
        });
        ipcMain.on("konsol", () => {
            logger("Konsol Aktifleştirildi.");
            mainWindow.webContents.openDevTools({mode: 'detach'});
        })
        ipcMain.on("hesapmakinasi", () => {
            processManager.checkAndKillCalc().then();
        })

    }
}