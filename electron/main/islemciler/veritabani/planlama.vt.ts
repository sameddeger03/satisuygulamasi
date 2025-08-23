import logger from "../../logger";
import {Knex} from "knex";
import {Hatirlatma, Plan, Planlama} from "@interfaces/index";
import {sqlTarih, sqlTarihSaatsiz} from "@kutuphane/index";

export class planlamaVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(tarih:Date=new Date(), ozel:string=""): Promise<Planlama|Hatirlatma[]|Plan[]> {
        try {
            let targetDate = sqlTarihSaatsiz(tarih)
            if(ozel!=""){
                switch (ozel) {
                    default: return [];
                    case "alarm": return await this.db.select('*').from('alarmlar').whereRaw("STRFTIME('%Y-%m-%d', tarih) = ?", [targetDate]).where("sil", 0);
                    case "plan": return await this.db.select('*').from('planlar').whereRaw("STRFTIME('%Y-%m-%d', tarih) = ?", [targetDate]).where("sil", 0);
                }
            }else {
                const alarmlar:Hatirlatma[] = await this.db.select('*').from('alarmlar').whereRaw("STRFTIME('%Y-%m-%d', tarih) = ?", [targetDate]).where("sil", 0);
                const planlar:Plan[] = await this.db.select('*').from('planlar').whereRaw("STRFTIME('%Y-%m-%d', tarih) = ?", [targetDate]).where("sil", 0);
                return { planlar:planlar, alarmlar:alarmlar };
            }
        } catch (error) {
            logger(error);
            return { planlar:[], alarmlar:[] };
        }
    }

    private isHatirlatma(request: any): request is Hatirlatma {
        return (request as Hatirlatma).baslik !== undefined;
    }
    private isPlan(request: any): request is Plan {
        return (request as Plan).tip !== undefined;
    }

    async bul(id:string|number,ne:string): Promise<Hatirlatma|Plan> {
        try {
            if(ne == "alarm") return await this.db.select('*').from('alarmlar').where('id', id).where("sil", 0).first();
            else if(ne=="plan")return await this.db.select('*').from('planlar').where('id', id).where("sil", 0).first();
            else return null;
        } catch (error) {
            logger(error)
            return null;
        }
    }

    async ekle(request: Hatirlatma|Plan): Promise<boolean> {
        try {
            if(!request.tarih) return false;
            request.tarih = sqlTarih(new Date(request.tarih));
            if(this.isHatirlatma(request)) {
                return await this.db('alarmlar').insert(request);
            } else if(this.isPlan(request)) {
                return await this.db('planlar').insert(request);
            }else return false;
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async guncelle(request: Hatirlatma|Plan): Promise<boolean> {
        try {
            if(this.isHatirlatma(request)) {
                return await this.db('alarmlar').where('id', request.id).update(request);
            } else if(this.isPlan(request)) {
                return await this.db('planlar').where('id', request.id).update(request);
            }else return false;
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async sil(id:string|number, ne:string): Promise<boolean> {
        try {
            if(ne == "alarm") {
                const alarm:Hatirlatma|boolean = await this.bul(id,"alarm") as Hatirlatma;
                if(typeof alarm == "boolean") return alarm;
                alarm.sil = true;
                await this.guncelle(alarm);
                return true;
            }else if(ne == "plan") {
                const plan:Plan|boolean = await this.bul(id,"plan") as Plan;
                if(typeof plan == "boolean") return plan;
                plan.sil = true;
                await this.guncelle(plan);
                return true;
            }else return false;
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async alarmUyar(id:string|number,eylem:boolean): Promise<boolean> {
        try {
            const alarm:Hatirlatma|boolean = await this.bul(id,"alarm") as Hatirlatma;
            if(typeof alarm == "boolean") return alarm;
            alarm.uyarildi = eylem;
            await this.guncelle(alarm);
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async planDurum(id:string|number,eylem:boolean): Promise<boolean> {
        try {
            const plan:Plan|boolean = await this.bul(id,"plan") as Plan;
            if(typeof plan == "boolean") return plan;
            plan.yapildi = eylem;
            await this.guncelle(plan);
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }
}