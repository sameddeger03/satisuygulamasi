import logger from "../../logger";
import {Knex} from "knex";
import {sqlTarih} from "@kutuphane/index";
import {Odeme, Urun, IadeUrun, Iade} from "@interfaces/index";

export class iadelerVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(tarih:Date=null): Promise<Iade[]> {
        try {
            if(tarih){
                let targetDate = sqlTarih(tarih).split(" ")[0];
                return await this.db.select('*').from('iadeler').whereRaw("STRFTIME('%Y-%m-%d', tarih) = ?", [targetDate]).where("sil", 0);
            }
            else return await this.db.select('*').from('iadeler').where("sil", 0);
        } catch (error) {
            logger(error);
            return [];
        }
    }

    async bul(id:string|number): Promise<Iade> {
        try {
            return await this.db.select('*').from('iadeler').where('id', id).where("sil", 0).first();
        } catch (error) {
            logger(error);
            return null;
        }
    }

    async ekle(request: Iade): Promise<boolean> {
        //Bu fonksiyon ödeme vt'de eklendi. Burda ekleme yapmıyoruz. Ödeme iade edildiğinde zaten bu iş yapılıyor.
        return false;
    }

    async guncelle(request: Iade): Promise<boolean> {
        try {
            return await this.db('iadeler').where('id', request.id).update(request);
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async sil(id:string|number): Promise<boolean> {
        //iptal işlemi yapıldığında silme işlemi 'tam' yapılıyor.
        return false;
    }
    async tamsil(id:string|number): Promise<boolean> {
        try {
            return this.db('iadeler').where('id', id).del();
        } catch (error) {
            logger(error);
            return false;
        }
    }
    async iptal(id:string|number): Promise<boolean> {
        try {
            const iadeOdeme:Iade|boolean = await this.bul(id);
            if(typeof iadeOdeme == "boolean") return iadeOdeme;
            const odeme : Odeme | boolean = await this.db('odemeler').where("id", iadeOdeme.odemeid).first();
            if(typeof odeme == "boolean") return odeme;
            const jsonIadeler = JSON.parse(iadeOdeme.icerik);
            const jsonUrunler = JSON.parse(odeme.icerik);
            jsonIadeler.forEach((iadeurun:IadeUrun) => {
                jsonUrunler.forEach((urun:Urun) => {
                    if(urun.id == iadeurun.id) {
                        urun.iade -= iadeurun.adet;
                        urun.adet += iadeurun.adet;
                    }
                })
            });
            odeme.icerik = JSON.stringify(jsonUrunler);
            await this.db('odemeler').where('id', iadeOdeme.odemeid).update(odeme);
            await this.tamsil(iadeOdeme.id);
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }
}