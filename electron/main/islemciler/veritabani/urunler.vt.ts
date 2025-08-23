import logger from "../../logger";
import {Knex} from "knex";
import {Urun, UrunListesi} from "@interfaces/index";
import {turunuBelirle} from "@kutuphane/index";
import fs from "fs";
import {app} from "electron";

export class urunlerVT {
    private db: Knex<any, unknown[]>;
    private toplamUrun = 0;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
        this.toplamKaydet();
    }
    toplamKaydet(){
        this.db('urunler').count({ count: '*' }).join('kategoriler', 'urunler.kategori', '=', 'kategoriler.id')
            .select('urunler.*', 'kategoriler.isim as kategori_isim')
            .where('urunler.sil', 0)
            .andWhere('kategoriler.sil', 0).first().then(toplam => {
            this.toplamUrun = toplam.count;
        });
    }
    async liste(sayfa, filtreler, sira): Promise<UrunListesi> {
        if (!sira || !sira.ne || !sira.yon) {
            sira = { tip: 'metin', ne: 'isim', yon: 'asc' };
        }
        if (!filtreler) {
            filtreler = [];
        }

        try {
            const offset = (sayfa - 1) * 25;
            let filtreliToplam = this.toplamUrun;

            // Veritabanından ürünleri çekiyoruz
            let urunler = await this.db('urunler')
                .join('kategoriler', 'urunler.kategori', '=', 'kategoriler.id')
                .select('urunler.*', 'kategoriler.isim as kategori_isim')
                .where('urunler.sil', 0)
                .andWhere('kategoriler.sil', 0);

            // Ürünleri sıralıyoruz
            urunler.sort((a, b) => {
                if(turunuBelirle(a[sira.ne]) != turunuBelirle(b[sira.ne])) return -1;
                if (sira.yon.toLowerCase() === 'asc') {
                    if(turunuBelirle(a[sira.ne]) == "m")
                        return a[sira.ne].localeCompare(b[sira.ne], 'tr');
                    if(turunuBelirle(a[sira.ne]) == "s")
                        return a[sira.ne] - b[sira.ne];
                } else {
                    if(turunuBelirle(a[sira.ne]) == "m")
                        return b[sira.ne].localeCompare(a[sira.ne], 'tr');
                    if(turunuBelirle(a[sira.ne]) == "s")
                        return b[sira.ne] - a[sira.ne];
                }
            });

            // Filtreleme işlemi
            for (let i = 0; i < urunler.length; i++) {
                const urun = urunler[i];

                if (filtreler.length) {
                    let sil = false;

                    for (let j = 0; j < filtreler.length; j++) {
                        const filtre = filtreler[j];
                        const aranan = filtre.deger.toString().toLocaleLowerCase("tr").trim();
                        const metin = urun[filtre.ne].toString().toLocaleLowerCase("tr").trim();

                        if (metin === "" || aranan === "") {
                            sil = true;
                            break;
                        }

                        const arananSayi = Number(aranan);
                        const sayi = Number(metin);

                        let kosulSaglandi = false;

                        switch (filtre.nasil) {
                            case "benzer":
                                kosulSaglandi = metin.includes(aranan);
                                break;
                            case "=":
                                kosulSaglandi = aranan === metin;
                                break;
                            case "!=":
                                kosulSaglandi = aranan !== metin;
                                break;
                            case "<=":
                                kosulSaglandi = sayi <= arananSayi;
                                break;
                            case ">=":
                                kosulSaglandi = sayi >= arananSayi;
                                break;
                            case "<":
                                kosulSaglandi = sayi < arananSayi;
                                break;
                            case ">":
                                kosulSaglandi = sayi > arananSayi;
                                break;
                        }

                        if (!kosulSaglandi) {
                            sil = true;
                            break;
                        }
                    }

                    if (sil) {
                        urunler.splice(i, 1);
                        i--; // Bir öğe silindikten sonra indeks güncellenmeli
                    }
                }
            }

            if (filtreler.length) {
                filtreliToplam -= urunler.length;
            }

            urunler = urunler.slice(offset, offset + 25);
            let topSayfa = 1;
            if(filtreliToplam < this.toplamUrun ) topSayfa = this.toplamUrun-filtreliToplam;
            else topSayfa = filtreliToplam;
            topSayfa = Math.ceil(topSayfa / 25);

            return {
                veriler: urunler as Urun[],
                sayfa: sayfa,
                topSayfa: topSayfa,
                filtreliToplam: filtreliToplam,
                toplam: this.toplamUrun
            };

        } catch (error) {
            logger("bune be!");
            logger(error);

            return {
                veriler: [],
                sayfa: 1,
                topSayfa: 1,
                filtreliToplam: 0,
                toplam: 0
            };
        }
    }

    async favs(): Promise<Urun[]> {
        try {
            const urunler = await this.db.select('*').from('urunler').where('fav', true).andWhere('sil', 0);
            return urunler as Urun[];
        } catch (error) {
            logger(error);
            return [];
        }
    }

    async bul(id: string | number, isBarkod = true, force = false, duzelt = true): Promise<Urun> {
        try {
            if(id == "rastgele") return await this.db.select('*').from('urunler').orderByRaw('RANDOM()').limit(1).first();
            if (isBarkod) {
                let miktar = null;
                const barkod_ = id.toString();
                if(barkod_.length == 13 && duzelt) {
                    if(barkod_.substring(0,4) == "2700") {
                        miktar = barkod_.substring(7,13);
                        id = barkod_.substring(0,7);
                    }
                }
                let sql = this.db.select('*').from('urunler').where('barkod', id);
                if (!force) sql = sql.where("sil", 0);
                const urun:Urun = await sql.first();
                if (urun) {
                    if(duzelt) {
                        urun.adet = 1;
                        if(miktar != null) {
                            if(urun.birim == "kilo") {
                                const kgValue = Math.floor(Number(miktar) / 10) / 1000;
                                urun.adet = kgValue.toFixed(3);
                            }
                        }
                    }
                    return urun;
                }
                return null;
            }else
                return await this.db.select('*').from('urunler').where('id', id).where("sil", 0).first();
        } catch (error) {
            return null;
        }
    }

    async ekle(request: Urun): Promise<boolean> {
        const bul = await this.bul(request.barkod,true, true);
        if(bul && bul.sil) {
            request.id = bul.id;
            request.sil = false;
            return await this.guncelle(request);
        }

        request.id = null;
        let sonuc = false;
        try {
            sonuc = await this.db('urunler').insert(request);
        } catch (error) {
            sonuc = false;
            console.warn(error,request)
        }
        this.toplamKaydet();
        return sonuc;
    }

    async guncelle(request: Urun): Promise<boolean> {
        try {
            return await this.db('urunler').where('id', request.id).update(request);
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async sil(id: string|number): Promise<boolean> {
        let sonuc = false;
        try {
            const urun:Urun|boolean = await this.bul(id, false);
            if(typeof urun == "boolean") return urun;
            urun.sil = true;
            sonuc = await this.guncelle(urun);
        } catch (error) {
            logger(error);
        }
        this.toplamKaydet();
        return sonuc;
    }
}