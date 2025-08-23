export interface Hatirlatma {
    id: number;
    baslik: string;
    mesaj: string;
    tarih: string;
    uyarildi: boolean;
    sil: boolean;
    uid?: string;
}

export interface Plan {
    id: number;
    mesaj: string;
    tip: string;
    tarih: string;
    yapildi: boolean;
    sil: boolean;
}

export interface Planlama {
    alarmlar: Hatirlatma[]|Array<any>;
    planlar: Plan[]|Array<any>;
}

export interface Note {
    id: number|null;
    baslik: string;
    mesaj: string;
    renk: string;
    tarih: string;
    sil: boolean;
}