import {Knex} from "knex";
import {Ayar} from "@interfaces/index";
import logger from "../../logger";

export class ayarlarVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    yeni(key: string, value: string|boolean) {
        if(typeof value == "boolean") value = value ? "evet" : "hayir";
        else value = value.toString();
        return this.db('ayarlar').insert({ degisken: key, deger: value })
    }
    async bul(key: string | number): Promise<Ayar> {
        try {
            return await this.db.select('*').from('ayarlar').where('degisken', key).first();
        } catch (error) {
            return null;
        }
    }
    async set(key: string, value: string|boolean) {
        const test = await this.bul(key);
        if(!test) return this.yeni(key, value);
        if(typeof value == "boolean") value = value ? "evet" : "hayir";
        else value = value.toString();
        return this.db('ayarlar').where('degisken', key).update('deger', value)
    }
    async get(key: string) {
        try {
           const test:Ayar = await this.bul(key);
           if(!test) return null;
           if (test.deger == "evet") return true;
           if (test.deger == "hayir") return false;
           return test.deger;
        } catch (error) {
            logger(error);
            return null;
        }
    }
    async liste():Promise<Ayar[]> {
        try {
            return await this.db.select('*').from('ayarlar');
        } catch (error) {
            logger(error);
            return [];
        }

    }
}