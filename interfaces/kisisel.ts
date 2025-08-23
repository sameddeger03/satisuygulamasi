export interface Kategori {
    id: number;
    isim: string;
    sil: boolean;
    gizle?: boolean;
}
export interface Urun {
    id: number;
    isim: string;
    kategori: Kategori;
    kategori_isim?: string;
    barkod: string;
    birim: string;
    fiyat: number;
    dfiyat?: string;
    sil: boolean;
    gizle?: boolean;
    adet: number|string;
    iade?: number;
    uid?: string;
    fav: boolean;
    imaj: string;
}

export interface  DUrun {
    isim: string;
    barkod: string;
    fiyat: number;
    kategori: number;
    birim: string;
    id?: number;
    sil?: boolean;
    imaj: string;
}

export interface UrunFiltre {
    isim: string;
    barkod: string;
    fiyatMin: string;
    fiyatMax: string;
    kategori: string;
    birim: string;
    he: string;
}
export interface UrunListesi {
    veriler: Urun[];
    sayfa: number;
    topSayfa: number;
    filtreliToplam: number;
    toplam: number;
}
export interface KategoriFiltre {
    isim: string;
}
export interface Odeme {
    id: number;
    icerik: string;
    odeme: boolean;
    kazanc: number;
    tarih: string;
    iptal: boolean;
    sil: boolean;
    metin?: string;
    gizle?: boolean;
    json?: string[];
    kazancStr?: string;
}
export interface Iade {
    id?: number;
    odemeid: number;
    icerik: string;
    neden?: string;
    tarih: string;
    sil: boolean;
    gizle?: boolean;
}
export interface IadeUrun{
    id: number;
    adet: number;
}
export interface Cevap {
    durum: boolean;
    mesaj: any;
    veri?: any;
}

export interface UrunSatislari {
    pos: KisiselUrun[];
    nakit:  KisiselUrun[];
    iade: KisiselIade[];
}
export interface KisiselUrun {
    ad: string;
    saat: string;
    miktar: number;
    fiyat: number;
    birim: string;
}
export interface KisiselIade {
    ad: string;
    saat: string;
    miktar: number;
    fiyat: number;
    birim: string;
    neden: string;
}
export interface GunSonuRaporu {
    toplamKazanc: number;
    nakitSatis: number;
    nakitKazanc: number;
    krediSatis: number;
    krediKazanc: number;
    urunSay: {nakit:number, pos:number, iade:number};
    urunSatislari: UrunSatislari;
    musteriSayisi: number;
    ortalamaSepetDegeri: number;
    iadeSayisi: number;
    promosyonlar: Array<{ id: number; ad: string; indirimOrani: number }>;
    kasaAcilis: string;
    kasaKapanis: string;
    giderler: Array<{ id: number; ad: string; tutar: number }>;
    digerNotlar: string;
}

export interface Siralama {
    tip: string;
    ne: string;
    yon: string;
}