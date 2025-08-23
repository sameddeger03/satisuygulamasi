export interface BildirimFace {
    id: string;
    uid: string;
    tip: string;
    baslik: string;
    mesaj: string;
    sure: number;
    gosterildi: boolean;
}

export interface RouteProps {
    gizle?: boolean
}

export interface Ayar {
    id: number;
    degisken: string;
    deger: any;
}

export interface Paket {
    id: number;
    paket: string;
}