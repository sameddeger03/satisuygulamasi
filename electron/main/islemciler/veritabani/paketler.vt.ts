import logger from "../../logger";
import {Knex} from "knex";
import {Paket} from "@interfaces/index";

export class paketlerVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(): Promise<Paket[]> {
        try {
            return await this.db.select('*').from('paketler');
        } catch (error) {
            logger(error);
            return [];
        }
    }

    async bul(paket:string): Promise<Paket> {
        try {
            return await this.db.select('*').from('paketler').where('paket', paket).first();
        } catch (error) {
            logger(error)
            return null;
        }
    }
    async ekle(request: Paket): Promise<boolean> {
        try {
            return await this.db('paketler').insert(request);
        } catch (error) {
            logger(error);
            return false;
        }
    }
}