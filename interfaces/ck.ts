import {Kategori} from "@interfaces/kisisel";

export interface ckListe {
    urunler: ckUrun[];
    kategoriler: ckKategori[];
    odemeler: ckOdeme[];
}

export interface ckUrun {
    id: number;
    isim: string;
    kategori: Kategori;
    kategori_isim: string;
    barkod: string;
    birim: string;
    fiyat: number;
    sil: boolean;
}

export interface ckKategori {
    id: number;
    isim: string;
    sil: boolean;
}

export interface ckOdeme {
    id: number;
    icerik: string;
    odeme: boolean;
    tarih: string;
    sil: boolean;
}

export interface ckObje {
    id: number;
    tablo: string;
}