import {app, BrowserWindow, shell, Menu, ipcMain, session, IpcMainEvent} from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from "node:fs";
import pkg from 'electron-updater';
import logger from "./logger";

const { autoUpdater } = pkg;

import vt from "./islemciler/veritabani";
import Dinleme from "./dinleme";
import {internet} from "./islemciler/internet";

const uygulama: Electron.App = app;
let anaPencere: Electron.BrowserWindow | null = null
let guncellemePencere: Electron.BrowserWindow | null = null

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const preload = path.join(__dirname, '../preload/index.mjs');

process.env.APP_ROOT = path.join(__dirname, '../..')
path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST

const bosHtml = path.join(RENDERER_DIST, 'bos.html');
const indexHtml = path.join(RENDERER_DIST, 'index.html');
const lockHtml = path.join(RENDERER_DIST, 'lock.html');
const guncellemeHtml = path.join(RENDERER_DIST, 'guncelleme.html');

let veritabani: vt|null = null;
let internetKontrol: internet;
let appYolu = "";
let yedekYolu = "";
let raporYolu = "";
let veriTabaniYolu = "";
let yazdirStilYolu = "";
let yazdirStil = "";

let kilitli = true;
let girilensifre = null;
let otoGiris = true;

if (os.release().startsWith('6.1')) uygulama.disableHardwareAcceleration()
if (!uygulama.requestSingleInstanceLock()) {
  uygulama.quit()
  process.exit(0)
}


async function pencere() {
  if(guncellemePencere != null) {
    guncellemePencere.close();
    guncellemePencere = null;
  }
  process.stdout.write(process.env.VITE_PUBLIC+'\n');
  anaPencere = new BrowserWindow({
    title: uygulama.getName(),
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload
    },
    width: 500,
    height: 500,
    show: true,
    frame: false,
    resizable: false,
    titleBarStyle: 'hidden'
  });
  anaPencere.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  await session.defaultSession.clearStorageData();

  appYolu = uygulama.getPath("documents")+"\\Satış Uygulaması";
  if(fs.existsSync(appYolu)===false) fs.mkdirSync(appYolu);
  yedekYolu = appYolu+"\\Yedekler";
  if(fs.existsSync(yedekYolu)===false) fs.mkdirSync(yedekYolu);
  raporYolu = appYolu+"\\Raporlar";
  if(fs.existsSync(raporYolu)===false) fs.mkdirSync(raporYolu);
  veriTabaniYolu = path.join(uygulama.getPath('userData'), 'satisuygulamasi.db');
  yazdirStilYolu = path.join(process.env.VITE_PUBLIC, 'yazdir.css');
  if(fs.existsSync(yazdirStilYolu)===false) fs.writeFileSync(yazdirStilYolu,"");
  yazdirStil = fs.readFileSync(yazdirStilYolu).toString();

  veritabani = new vt(veriTabaniYolu,yedekYolu);
  await veritabani.baglan();
  await veritabani.tabloKontrol();
  await veritabani.tablolaribagla();

  (new Dinleme()).basla(uygulama, anaPencere, veritabani);

  internetKontrol = new internet();
  internetKontrol.zamanla();
  await uygulamayiBaslat();
}
async function uygulamayiBaslat() {
  anaPencere.hide();
  anaPencere.resizable = true;
  if(kilitli){
    anaPencere.setSize(500,500);
    anaPencere.unmaximize();
    if (VITE_DEV_SERVER_URL)
      await anaPencere.loadURL(VITE_DEV_SERVER_URL+"lock.html");
    else
      await anaPencere.loadFile(lockHtml).then();
  }else {
    anaPencere.maximize();
    if (VITE_DEV_SERVER_URL)
      await anaPencere.loadURL(VITE_DEV_SERVER_URL);
    else
      await anaPencere.loadFile(indexHtml).then();
  }
  anaPencere.show();
  anaPencere.resizable = false;
}

uygulama.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.on('ready', async () => {
  if (VITE_DEV_SERVER_URL) {
    await pencere();
    anaPencere.webContents.openDevTools({ mode: 'detach' });
    return;
  }
  guncellemePencere = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      preload
    },
    show: true,
    frame: false,
    resizable: false,
    titleBarStyle: 'hidden'
  });
  await guncellemePencere.loadURL(guncellemeHtml);
  await autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  logger('Güncelleme mevcut!');
});
autoUpdater.on('download-progress', (progressObj) => {
  logger(`İndirilen: ${progressObj.percent}%`);
  guncellemePencere.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', () => {
  logger('Güncelleme indirildi!');
  guncellemePencere.webContents.send('update-downloaded');
  autoUpdater.quitAndInstall(true, true);
});

autoUpdater.on('update-not-available', async () => {
  logger('Güncelleme bulunamadı, uygulama normal çalışmaya devam ediyor.');
  await pencere();
});

autoUpdater.on('error', async (error) => {
  console.error('Güncelleme sırasında hata oluştu:', error.message);
  if (error.message.includes('status code') && !error.message.includes('status code 200')) {
    logger('HTTP 200 dışında bir durum kodu alındı, güncellemeyi atla.');
  }
  await pencere();
});


uygulama.on('window-all-closed', () => {
  anaPencere = null;
  if (process.platform !== 'darwin') uygulama.quit()
})

ipcMain.handle("versiyon", async (event: IpcMainEvent) => {
  return app.getVersion();
})

ipcMain.on("kilitle", async (event) => {
  kilitli = true;
  otoGiris = false;
  uygulamayiBaslat().then();
})

ipcMain.on("kilit", async (event) => {
  event.reply("kilit-response", [(await veritabani.ayarlar.get("sifre"))!="",otoGiris]);
})

ipcMain.on("devamet", async (event) => {
  if(girilensifre!=null || (await veritabani.ayarlar.get("sifre"))=="") {
    kilitli = false;
    uygulamayiBaslat().then();
  }
})

ipcMain.on("sifre", async (event, sifre: string) => {
  const dogrulama = (await veritabani.ayarlar.get("sifre"))==sifre;
  if(dogrulama)girilensifre = sifre;
  else girilensifre = null;
  event.reply("sifre-response", dogrulama);
})

ipcMain.on("yazdir", async (event, baslik, html) => {
  const printWin = new BrowserWindow({
    title: baslik,
    show: false
  });
  html = '<style>' + yazdirStil + '</style>' + html + '';
  await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  printWin.webContents.print({
    silent:false,
    printBackground:false,
    margins: {
      marginType: "none" as const,
    }
  }, () => {
    printWin.close();
  });
});
ipcMain.on("pdf", async (event, baslik, html) => {
  const printWin = new BrowserWindow({
    title: baslik,
    show: false
  });
  html = '<style>' + yazdirStil + '</style>' + html + '';
  await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  printWin.webContents.printToPDF({}).then(data => {
    const pdfPath = path.join(raporYolu, baslik+'.pdf');
    fs.writeFile(pdfPath, data, (error) => {
      if (error) throw error;
      logger('PDF başarıyla oluşturuldu:', pdfPath);
      shell.showItemInFolder(pdfPath)
    });
  }).catch(error => {
    logger(error);
  });
});