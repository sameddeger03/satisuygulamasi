import logger from "../../logger";
import {Knex} from "knex";
import {Note} from "@interfaces/index/planlama";

export class notdefteriVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(): Promise<Note[]> {
        try {
            return await this.db.select('*').from('notlar').where("sil", 0);
        } catch (error) {
            logger(error);
            return [];
        }
    }

    async bul(id:string|number): Promise<Note> {
        try {
            return await this.db.select('*').from('notlar').where('id', id).where("sil", 0).first();
        } catch (error) {
            logger(error)
            return null;
        }
    }

    async ekle(request: Note): Promise<number> {
        try {
            if(request.baslik == "") request.baslik = null;
            const [id] = await this.db('notlar').insert(request);
            return id;
        } catch (error) {
            logger(error);
            return -1;
        }
    }

    async guncelle(request: Note): Promise<boolean> {
        try {
            return await this.db('notlar').where('id', request.id).update(request);
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async sil(id:string|number): Promise<boolean> {
        try {
            const note:Note = await this.bul(id);
            if(typeof note == "boolean") return note;
            note.sil = true;
            await this.guncelle(note);
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }
}