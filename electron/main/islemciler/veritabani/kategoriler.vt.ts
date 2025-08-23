import logger from "../../logger";
import {Knex} from "knex";
import {Kategori} from "@interfaces/index";

export class kategorilerVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(): Promise<Kategori[]> {
        try {
            return await this.db.select('*').from('kategoriler').where("sil", 0);
        } catch (error) {
            logger("Kategori listeleme hatası",error)
            return [];
        }
    }
    async bul(id:string|number,isimMi=false, silinmisObje = false): Promise<Kategori> {
        try {
            const istek:Knex.QueryBuilder = this.db.select('*').from('kategoriler');
            if(isimMi)
                istek.where('isim', id);
            else
                istek.where('id', id);
            if(!silinmisObje)
                istek.where("sil", 0);
            return await istek.first();
        } catch (error) {
            logger("Kategori bulma hatası",error)
            return null;
        }
    }
    async urunVarmi(id:string|number): Promise<boolean> {
        try {
            const test = await this.db.select('*').from('urunler').where('kategori', id).where("sil", 0);
            return test.length > 0;
        } catch (error) {
            logger("Kategori için ürün bulma hatası",error)
            return true;
        }
    }
    async ekle(request: Kategori): Promise<boolean> {
        try {
            const bul = await this.bul(request.isim,true, true);
            if(bul) {
                request.id = bul.id;
                request.sil = false;
                return await this.guncelle(request);
            }
            request.id = null;
            return await this.db('kategoriler').insert(request);
        } catch (error) {
            logger("Kategori ekleme hatası",error)
            return false;
        }
    }

    async guncelle(request: Kategori): Promise<boolean> {
        try {
            return await this.db('kategoriler').where('id', request.id).update(request);
        } catch (error) {
            logger("Kategori guncelleme hatası",error)
            return false;
        }
    }
    async sil(id:string|number): Promise<boolean> {
        try {
            const kategori:Kategori = await this.bul(id);
            kategori.sil = true;
            await this.guncelle(kategori);
            return true;
        } catch (error) {
            logger("Kategori silme hatası",error)
            return false;
        }
    }
}