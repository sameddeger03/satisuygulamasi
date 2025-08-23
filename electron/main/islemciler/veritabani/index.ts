import knex, {Knex} from 'knex';
import logger from "../../logger";
import {ayarlarVT} from "./ayarlar.vt";
import {kategorilerVT} from "./kategoriler.vt";
import {urunlerVT} from "./urunler.vt";
import {odemelerVT} from "./odemeler.vt";
import {iadelerVT} from "./iadeler.vt";
import {planlamaVT} from "./planlama.vt";
import {notdefteriVT} from "./notdefteri.vt";
import {paketlerVT} from "./paketler.vt";
import {ckVT} from "./copkutusu.vt";

class vt {
    dbPath: string;
    yedekPath: string;
    db: Knex<any, unknown[]>;
    kategoriler:kategorilerVT;
    urunler:urunlerVT;
    odemeler:odemelerVT;
    iadeler:iadelerVT;
    planlama:planlamaVT;
    ayarlar:ayarlarVT;
    notdefteri:notdefteriVT;
    paketler:paketlerVT;
    ck:ckVT;

    constructor(dbPath:string, yedekPath:string) {
        this.dbPath = dbPath;
        this.yedekPath = yedekPath
    }

    async baglan(dbPath=this.dbPath) {
        try {
            this.db = knex({ debug: false,useNullAsDefault: true, client: 'better-sqlite3', connection: { filename: dbPath }})
            return true;
        }catch (err) {
            logger(err)
            return false;
        }
    }

    async tablolaribagla() {
        try {
            this.kategoriler = new kategorilerVT(this.db)
            this.urunler = new urunlerVT(this.db)
            this.odemeler = new odemelerVT(this.db)
            this.iadeler = new iadelerVT(this.db)
            this.planlama = new planlamaVT(this.db)
            this.ayarlar = new ayarlarVT(this.db)
            this.notdefteri = new notdefteriVT(this.db)
            this.paketler = new paketlerVT(this.db)
            this.ck = new ckVT(this.db)
            return true;
        } catch (err) {
            logger(err)
            return false
        }
    }

    async tabloKontrol() {
        const db = this.db;
        try {
            if (!(await db.schema.hasTable('ayarlar'))) {
                await db.schema.createTable('ayarlar', table => {
                    table.increments('id').primary();
                    table.string('degisken').notNullable();
                    table.string("deger").defaultTo("");
                });
            }
            if (!(await db.schema.hasTable('kategoriler'))) {
                await db.schema.createTable('kategoriler', table => {
                    table.increments('id').primary();
                    table.string('isim').unique();
                    table.boolean('sil').defaultTo(false);
                });
            }
            if (!(await db.schema.hasTable('urunler'))) {
                await db.schema.createTable('urunler', table => {
                    table.increments('id').primary();
                    table.string('isim').defaultTo("?");
                    table.string('barkod').unique();
                    table.float('kategori').unsigned().notNullable().references('id').inTable('kategoriler').onDelete('CASCADE');
                    table.string('birim').defaultTo("adet");
                    table.float('fiyat').defaultTo(0);
                    table.boolean('fav').defaultTo(false); // 1.5.9 ile eklendi
                    table.string('imaj').defaultTo(""); // 1.6.0 ile eklendi
                    table.boolean('sil').defaultTo(false);
                });
            }

            if (!(await db.schema.hasTable('odemeler'))) {
                await db.schema.createTable('odemeler', table => {
                    table.increments('id').primary();
                    table.string('icerik').defaultTo('{}');
                    table.boolean('odeme').defaultTo(true);
                    table.timestamp('tarih').defaultTo(db.fn.now());
                    table.string('kazanc').defaultTo("0");
                    table.boolean('sil').defaultTo(false);
                });
            }

            if (!(await db.schema.hasTable('iadeler'))) {
                await db.schema.createTable('iadeler', table => {
                    table.increments('id').primary();
                    table.float('odemeid').unsigned().notNullable().references('id').inTable('odemeler').onDelete('CASCADE')
                    table.string('icerik').defaultTo('{}');
                    table.string('neden').defaultTo('');
                    table.timestamp('tarih');
                    table.boolean('sil').defaultTo(false);
                });
            }

            if (!(await db.schema.hasTable('alarmlar'))) {
                await db.schema.createTable('alarmlar', table => {
                    table.increments('id').primary();
                    table.string('baslik').defaultTo("İsimsiz Alarm");
                    table.string('mesaj').notNullable();
                    table.timestamp('tarih').notNullable();
                    table.boolean('uyarildi').defaultTo(false);
                    table.boolean('sil').defaultTo(false);
                });
            }

            if (!(await db.schema.hasTable('notlar'))) {
                await db.schema.createTable('notlar', table => {
                    table.increments('id').primary();
                    table.string('baslik').defaultTo("Başlıksız Not");
                    table.string('mesaj').notNullable();
                    table.string("renk").defaultTo("#000000");
                    table.timestamp('tarih').notNullable();
                    table.boolean('sil').defaultTo(false);
                });
            }

            if (!(await db.schema.hasTable('planlar'))) {
                await db.schema.createTable('planlar', table => {
                    table.increments('id').primary();
                    table.string('mesaj').notNullable();
                    table.string("tip").defaultTo("info");
                    table.boolean('yapildi').defaultTo(false);
                    table.timestamp('tarih').notNullable();
                    table.boolean('sil').defaultTo(false);
                });
            }

            if (!(await db.schema.hasTable('paketler'))) {
                await db.schema.createTable('paketler', table => {
                    table.increments('id').primary();
                    table.string('paket').notNullable();
                });
            }

            const sonradanEklendi = {
                "urunler": [
                    {
                        "isim":"fav",
                        "tip": "mantik",
                        "varsayilan": false
                    },
                    {
                        "isim":"imaj",
                        "tip": "metin",
                        "varsayilan": ""
                    }
                ],
                /*"ayarlar": [
                    {
                        "isim":"imajgoster",
                        "tip": "mantik",
                        "varsayilan": false
                    }
                ]*/
            };

            const sonradanCikarildi = {
                "ayarlar": ["imajgoster"]
            }

            await (async () => {
                for (const tablo in sonradanEklendi) {
                    const sutunlar = sonradanEklendi[tablo];
                    for (const ne of sutunlar) {
                        let sutunVar = await db.schema.hasColumn(tablo, ne.isim);
                        if (!sutunVar) {
                            await db.schema.alterTable(tablo, table => {
                                switch (ne.tip) {
                                    case "metin":
                                        table.string(ne.isim).defaultTo(ne.varsayilan);
                                        break;
                                    case "mantik":
                                        table.boolean(ne.isim).defaultTo(ne.varsayilan);
                                        break;
                                    case "sayi":
                                        table.float(ne.isim).defaultTo(ne.varsayilan);
                                        break;
                                    case "tarih":
                                        table.timestamp(ne.isim).defaultTo(ne.varsayilan);
                                        break;
                                }
                            });
                        }
                    }
                }
            })();
            await (async () => {
                for (const tablo in sonradanCikarildi) {
                    const sutunlar = sonradanCikarildi[tablo];
                    for (const ne of sutunlar) {
                        let sutunVar = await db.schema.hasColumn(tablo, ne);
                        if (sutunVar) {
                            const columns = await db.raw('PRAGMA table_info(' + tablo + ')');
                            const newColumns = columns
                                .filter(col => col.name !== ne)
                                .map(col => ({
                                    name: col.name,
                                    type: col.type,
                                    notnull: col.notnull,
                                    dflt_value: col.dflt_value,
                                    pk: col.pk
                                }));
                            const createTableSQL = `CREATE TABLE new_table ( ${newColumns.map(col => `${col.name} ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value !== null ? `DEFAULT ${col.dflt_value}` : ''} ${col.pk ? 'PRIMARY KEY' : ''}`).join(', ')})`;
                            await db.raw(createTableSQL);
                            await db.raw(`INSERT INTO new_table (${newColumns.map(col => col.name).join(', ')}) SELECT ${newColumns.map(col => col.name).join(', ')} FROM ${tablo}`);
                            await db.raw('DROP TABLE ' + tablo);
                            await db.raw('ALTER TABLE new_table RENAME TO ' + tablo);
                        }
                    }
                }
            })();


            this.db.select('*').from('kategoriler').where("sil", 0).then(async katlist => {
                if (katlist && katlist.length === 0)
                    await db('kategoriler').insert({isim: "Kategorisiz", sil: false});
            })
            this.db.select('*').from('ayarlar').then(async ayarlist => {
                if (ayarlist && ayarlist.length === 0) {
                    await db('ayarlar').insert({degisken: "sirket", deger: "isimsiz şirket"});
                    await db('ayarlar').insert({degisken: "kurusDuzelt", deger: "evet"});
                    await db('ayarlar').insert({degisken: "sifre", deger: ""});
                    await db('ayarlar').insert({degisken: "localyedek", deger: "hayir"});
                    await db('ayarlar').insert({degisken: "remoteyedek", deger: "hayir"});
                    await db('ayarlar').insert({degisken: "kilit", deger: "hayir"});
                    await db('ayarlar').insert({degisken: "token", deger: ""});
                }
            })

            const sonradanEklenenAyarlar = {
                "degisken": "imajGoster",
                "deger": "evet"
            }

            await (async () => {
                const sutunlar = sonradanEklenenAyarlar;
                let degiskenVar = await db.table("ayarlar").where("degisken", sutunlar.degisken).first();
                if (!degiskenVar) {
                    await db('ayarlar').insert({degisken: sutunlar.degisken, deger: sutunlar.deger});
                }
            })();

            return true;
        } catch (err) {
            console.error('Tablo oluşturulurken hata oluştu:', err);
            return false;
        }
    }


    async kapat(){
        try {
            await this.db.destroy();
            logger('Veritabanı bağlantısı başarıyla sonlandırıldı.');
            this.dbPath = "";
            this.db = null;
            return true;
        } catch (err) {
            console.error('Veritabanı bağlantısı sonlandırılırken hata oluştu:', err);
            return false;
        }
    }
}

export default vt;

