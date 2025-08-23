import {app, ipcMain, IpcMainEvent} from "electron";
import logger from "../logger";

import pkg from 'node-machine-id';
import fs from 'node:fs';

import FormData from 'form-data';
import vt from "../islemciler/veritabani";
import axios from 'axios';
import path from "node:path";
import * as crypto from 'crypto';

const { machineIdSync } = pkg;
let uygulama = null;
const domain = "http://apps.rovave.com";
const ip = "http://185.153.220.122:8080"
let anadom = "";

async function dm(){
    try {
        const response = await axios.get("http://rovave.com");
        if(response.data == "ok") anadom = domain;
        else anadom = ip;
    } catch (error) {
        anadom = ip;
    }
    console.log(anadom)
    logger(anadom);
}

async function girisyap(veriler:[]) {
    try {
        const response = await axios.post(anadom+'/satisuygulamasi/yedek/yetki', veriler);
        logger(response.data)
        return response.data;
    } catch (error) {
        return {durum: false, mesaj: error.message, token: ""};
    }
}
async function tarihGetir(token: string) {
    try {
        const response = await axios.get(anadom+'/satisuygulamasi/yedek/tarih/'+machineIdSync()+'/'+token)
        return response.data;
    } catch (error) {
        return {durum: false, mesaj: error.message, token: ""};
    }
}
async function yukle(dosyaYolu: string,token:string) {
    try {
        var formData = new FormData();
        formData.append("db", fs.createReadStream(dosyaYolu));
        const response = await axios.post(anadom+'/satisuygulamasi/yedek/yukle/'+machineIdSync()+'/'+token, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data;
    } catch (error) {
        return {durum: false, mesaj: error.message, token: ""};
    }
}

function enYeniDosyayiBul(dizinYolu: string): string | null {
    const dosyalar = fs.readdirSync(dizinYolu);
    let enYeniDosya: string | null = null;
    let enYeniZaman = 0;

    dosyalar.forEach(dosya => {
        const dosyaYolu = path.join(dizinYolu, dosya);
        const dosyaBilgisi = fs.statSync(dosyaYolu);

        if (dosyaBilgisi.isFile() && dosyaBilgisi.mtimeMs > enYeniZaman) {
            enYeniDosya = dosyaYolu;
            enYeniZaman = dosyaBilgisi.mtimeMs;
        }
    });

    return enYeniDosya;
}

async function indir(dosyaYolu: string,token:string) {
    try {
        const response = await axios.get(anadom+'/satisuygulamasi/yedek/indir/'+machineIdSync()+'/'+token, {
            responseType: 'arraybuffer'
        })
        const fileData = Buffer.from(response.data, 'binary');
        fs.writeFileSync(dosyaYolu, fileData);
        return {durum: true, mesaj: "Yedek dosyası indirildi.", token};
    } catch (error) {
        if(error.response.status == 404)
            return {durum: false, mesaj: "Yedek dosyası bulunamadı.", token};
        if(error.response.status == 403)
            return {durum: false, mesaj: "Token geçersiz.", token:null};
        logger(error);
        return {durum: false, mesaj: error.message, token};
    }
}

let yedeklemeZamanlayiciLokal = null;
let yedeklemeZamanlayiciRemote = null;
function yedekDosyalariSil(yedekYol: string) {
    const dosyalar = fs.readdirSync(yedekYol)
        .map(dosya => {
            const dosyaYolu = path.join(yedekYol, dosya);
            const istatistik = fs.statSync(dosyaYolu);
            return {
                dosyaYolu,
                dosyaAdi: dosya,
                zamanDamgasi: istatistik.mtimeMs
            };
        })
        .filter(dosya => path.extname(dosya.dosyaAdi) === '.sqlite')
        .sort((a, b) => b.zamanDamgasi - a.zamanDamgasi);

    const simdi = Date.now();
    const ucGunMilisaniye = 3 * 24 * 60 * 60 * 1000;

    dosyalar.forEach((dosya, index) => {
        if (index >= 10 || (simdi - dosya.zamanDamgasi > ucGunMilisaniye)) {
            fs.unlinkSync(dosya.dosyaYolu);
            logger(`${dosya.dosyaAdi} silindi.`);
        }
    });
}
function dosyaHashOlustur(dosyaYolu: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(dosyaYolu);

        stream.on('data', (data) => {
            hash.update(data);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}



async function dosyalariKarsilastir(dosyaYolu1: string|null, dosyaYolu2: string) {
    if(dosyaYolu1 == null) return false;
    try {
        const hash1 = await dosyaHashOlustur(dosyaYolu1);
        const hash2 = await dosyaHashOlustur(dosyaYolu2);
        return hash1 === hash2;
    } catch (error) {
        return false;
    }
}
let paketler = [];
async function paketKontrol(){
    try {
        const response = await axios.get(anadom + '/satisuygulamasi/paket/kontrol/' + machineIdSync())
        if (response.data.durum)
            paketler = response.data.liste;
    } catch (error) {
        logger(error);
    }
}

async function paketyukle(vt, paket: string) {
    try {
        const response = await axios.get(anadom+'/satisuygulamasi/paket/icerik/'+machineIdSync()+'/'+paket);
        if(response.data.durum){
            switch (response.data.tablo) {
                case "urunler":
                    let degisim = response.data.degisim;
                    if (degisim != "*") degisim = degisim.split("|");
                    for (let urun of response.data.icerik) {
                        urun.barkod = urun.barkod.toString();
                        const bul = await vt.urunler.bul(urun.barkod, true, true);
                        if (bul) {
                            if(degisim == "*"){
                                await vt.urunler.guncelle(urun);
                            }else {
                                for(let i = 0; i < degisim.length; i++)
                                    bul[degisim[i]] = urun[degisim[i]];
                                bul.sil = 0;
                                delete bul.adet;
                                await vt.urunler.guncelle(bul);
                            }
                        } else {
                            await vt.urunler.ekle(urun);
                        }
                    }
            }
            logger("Paket yüklendi.");
        }
    } catch (error) {
        logger("Paket dosyası hata!!!.");
        console.log(error);
    }
}

export class yedek {
    private vt:vt;
    constructor(veritabani:vt) {
        logger("Yedekleme işlemcisi aktifleştirildi.");
        uygulama = app;
        this.vt = veritabani;
        yedekDosyalariSil(this.vt.yedekPath);


        this.islemci()
    }
    islemci = ():void => {
        ipcMain.on("paket-kontrol", async (event: IpcMainEvent) => {
            dm().then(async () => {
                await paketKontrol() //test;
                for (const paket of paketler) {
                    let mevcutPaket = await this.vt.paketler.bul(paket);
                    if (mevcutPaket) {
                        logger("Paket zaten yuklenmis: " + paket);
                    } else {
                        await paketyukle(this.vt, paket);
                        await this.vt.paketler.ekle({ id: null, paket: paket });
                    }
                }
                event.reply("kontrol.paket-response", {durum: true, mesaj: true, veri: {islem:"paket"} });
            }).catch(() => {
                event.reply("kontrol.paket-response", {durum: true, mesaj: true, veri: {islem:"paket"} });
            });
        })
        ipcMain.on("oto-yedekleme-lokal", (event: IpcMainEvent, durum:boolean) => {
            if(yedeklemeZamanlayiciLokal != null)
                clearInterval(yedeklemeZamanlayiciLokal);
            if(durum) {
                yedeklemeZamanlayiciLokal = setInterval(async () => {
                    if (await dosyalariKarsilastir(enYeniDosyayiBul(this.vt.yedekPath), this.vt.dbPath) == false) {
                        const yedekdosyasi = this.vt.yedekPath + "\\su.yedek." + (new Date()).getTime() + ".sqlite";
                        fs.copyFileSync(this.vt.dbPath, yedekdosyasi);
                        fs.utimesSync(yedekdosyasi, new Date(), new Date());
                    }
                    yedekDosyalariSil(this.vt.yedekPath);
                }, 1000 * 60 * 60);
            }
        })
        ipcMain.on("oto-yedekleme-remote", (event: IpcMainEvent, bilgi:any) => {
            if(yedeklemeZamanlayiciRemote != null)
                clearInterval(yedeklemeZamanlayiciRemote);
            if(typeof bilgi.durum === "undefined") bilgi.durum = false;
            if(typeof bilgi.token === "undefined") bilgi.token = "";
            if(bilgi.durum) {
                yedeklemeZamanlayiciRemote = setInterval(async () => {
                    await yukle(this.vt.dbPath, bilgi.token);
                }, 1000 * 60 * 60);
            }
        })
        ipcMain.handle("macid", async (event: IpcMainEvent) => {
            return machineIdSync();
        })
        ipcMain.handle("giris-yap", async (event: IpcMainEvent, veriler: any) => {
            veriler.giris = 1;
            try {
                return await girisyap(veriler);
            } catch (error) {
                logger(error)
                return {durum: false, mesaj: error.message, token: ""};
            }
        })
        ipcMain.handle("yedek-ver", async (event: IpcMainEvent, token:string, local:boolean=false) => {
            if(local) {
                logger("LOCAL YEDEK")
                try {
                    const yedekdosyasi = this.vt.yedekPath + "\\su.yedek." + (new Date()).getTime() + ".sqlite";
                    fs.copyFileSync(this.vt.dbPath, yedekdosyasi);
                    fs.utimesSync(yedekdosyasi, new Date(), new Date());
                    return {durum: true, mesaj: "Belgelerim'e yedek dosyası oluşturuldu.", token: ""};
                } catch (error) {
                    logger(error)
                    return {durum: false, mesaj: error.message, token: ""};
                }
            }
            else
                try {
                    return await yukle(this.vt.dbPath, token);
                } catch (error) {
                    logger(error)
                    return {durum: false, mesaj: error.message, token: ""};
                }
        })
        ipcMain.handle("yedek-al", async (event: IpcMainEvent, token:string, local:boolean=false) => {
            if(local)
                try {
                    fs.copyFileSync(enYeniDosyayiBul(this.vt.yedekPath),this.vt.dbPath);
                    return {durum: true, mesaj: "En güncel yedek dosyası indirildi.", token: ""};
                } catch (error) {
                    logger(error)
                    return {durum: false, mesaj: error.message, token: ""};
                }
            else
                try {
                    return await indir(this.vt.dbPath, token);
                } catch (error) {
                    logger(error)
                    return {durum: false, mesaj: error.message, token: ""};
                }
        })
        ipcMain.handle("son-yedek-tarihi", async (event: IpcMainEvent, token:string, local:boolean=false) => {
            if(local)
                try {
                    const yedek_ = enYeniDosyayiBul(this.vt.yedekPath);
                    if(yedek_ == null) return {durum: false, mesaj: null, token: "local"}
                    const stats = fs.statSync(yedek_);
                    const sonGuncellenme = stats.mtime;
                    return {durum: true, mesaj: sonGuncellenme.getTime(), token: "local"};
                } catch (err) {
                    return {durum: false, mesaj: err.message, token: "local"};
                }
            else
                try {
                    return await tarihGetir(token);
                } catch (error) {
                    logger(error)
                    return {durum: false, mesaj: error.message, token: "remote"};
                }
        });
    }
}