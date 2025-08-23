import logger from "../../logger";
import {Knex} from "knex";
import {ckUrun, ckOdeme, ckKategori, ckListe, Urun} from "@interfaces/index";

export class ckVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(): Promise<ckListe> {
        const ls:ckListe = {
            urunler: [],
            kategoriler: [],
            odemeler: []
        }
        try {
            ls.urunler = await this.db('urunler')
                .join('kategoriler', 'urunler.kategori', '=', 'kategoriler.id')
                .select('urunler.*', 'kategoriler.isim as kategori_isim')
                .where('urunler.sil', 1);
            ls.kategoriler = await this.db.select('*').from('kategoriler').where('sil', 1);
            ls.odemeler = await this.db.select('*').from('odemeler').where('sil', 1);
            ls.odemeler.forEach((e:ckOdeme)=>{
                const icerik:string[] = [];
                JSON.parse(e.icerik).forEach((i:ckUrun)=>{
                    icerik.push(i.isim);
                })
                e.icerik = icerik.join(", ");
            })
            return ls;
        } catch (error) {
            logger(error);
            return {
                urunler: [],
                kategoriler: [],
                odemeler: []
            };
        }
    }

    async bul(id: string | number, tablo: string): Promise<ckUrun|ckKategori|ckOdeme|null> {
        try {
            try {
                return await this.db.select('*').from(tablo).where('id', id).first();
            } catch (error) {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    async kurtar(id: string | number, tablo: string): Promise<boolean> {
        try {
            const request = await this.bul(id, tablo);
            if(!request) return false;
            request.sil = false;
            await this.db(tablo).where('id', id).update(request);
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async sil(id: string | number, tablo: string): Promise<boolean> {
        try {
            const request = await this.bul(id, tablo);
            if(!request) return false;
            await this.db(tablo).where('id', id).delete();
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }
}