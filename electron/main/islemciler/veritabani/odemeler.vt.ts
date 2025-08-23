import logger from "../../logger";
import {Knex} from "knex";
import {sqlTarih, kurusDuzelt } from "@kutuphane/index";
import {Odeme, Urun, IadeUrun, Iade} from "@interfaces/index";

export class odemelerVT {
    private db: Knex<any, unknown[]>;
    constructor(db: Knex<any, unknown[]>) {
        this.db = db
    }
    async liste(tarih:Date=null): Promise<Odeme[]> {
        try {
            const istek = this.db.select('*').from('odemeler');
            if(tarih){
                const targetDate = sqlTarih(tarih).split(" ")[0];
                istek.whereRaw("STRFTIME('%Y-%m-%d', tarih) = ?", [targetDate]);
            }
            return await istek.where("sil", 0).orderBy('tarih', 'desc');
        } catch (error) {
            logger(error);
            return [];
        }
    }

    async bul(id:string|number): Promise<Odeme> {
        try {
            return await this.db.select('*').from('odemeler').where('id', id).where("sil", 0).first();
        } catch (error) {
            logger(error);
            return null;
        }
    }

    async ekle(request: Odeme): Promise<boolean> {
        try {
            const kontrol = await this.db.select("*").from('ayarlar').where("degisken","kurusDuzelt").first();
            if(kontrol && (kontrol.deger == "1" || kontrol.deger == true)) {
                const yeniIcerik = [];
                const json = JSON.parse(request.icerik);
                json.forEach((urun:Urun) => {
                    urun.fiyat = kurusDuzelt(urun.fiyat);
                    yeniIcerik.push(urun);
                });
                request.icerik = JSON.stringify(yeniIcerik);
            }
            request.tarih = sqlTarih();
            return await this.db('odemeler').insert(request);
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async guncelle(request: Odeme): Promise<boolean> {
        try {
            return await this.db('odemeler').where('id', request.id).update(request);
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async sil(id:string|number): Promise<boolean> {
        try {
            const odeme:Odeme|boolean = await this.bul(id);
            if(typeof odeme == "boolean") return odeme;
            odeme.sil = true;
            await this.guncelle(odeme);
            return true;
        } catch (error) {
            logger(error);
            return false;
        }
    }

    async iade(odemeid:string|number, iadeurunler:Array<IadeUrun>, neden:string): Promise<boolean> {
        try {
            const odeme:Odeme|boolean = await this.bul(odemeid);
            if(typeof odeme == "boolean") return odeme;

            const json = JSON.parse(odeme.icerik);
            json.forEach((urun:Urun) => {
                iadeurunler.forEach((iadeurun:IadeUrun) => {
                    if(urun.id == iadeurun.id) {
                        if(urun.birim == "adet"){
                            if (urun.adet - 1 < 0) {
                                throw new RangeError('Üründe yeterli adet yok. [' + urun.adet + ' | ' + iadeurun.adet + ']');
                            }
                            urun.iade += 1;
                            urun.adet -= 1;
                        }else {
                            if (urun.adet - iadeurun.adet < 0) {
                                throw new RangeError('Üründe yeterli kilo yok. [' + urun.adet + ' | ' + iadeurun.adet + ']');
                            }
                            urun.iade += iadeurun.adet;
                            urun.adet -= iadeurun.adet;
                        }
                    }
                })
            });
            odeme.icerik = JSON.stringify(json);
            await this.db('odemeler').where('id', odeme.id).update(odeme);
            const iade:Iade = {odemeid: parseInt(odeme.id.toString()), icerik:JSON.stringify(iadeurunler), neden: neden.toString(), tarih: sqlTarih(), sil:false};
            await this.db('iadeler').insert(iade);
            await this.guncelle(odeme);
            return true;
        } catch (error) {
            logger.warn(error);
            return false;
        }
    }
}