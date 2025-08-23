import moment from "moment";
import 'moment/dist/locale/tr';
import {ilkharf} from "@kutuphane/genel";

//ödeme listesinde kullanıyoruz.
export function tarihFormatla(originalDate:string, bosluk:string=" ") {
    const dateObj = new Date(originalDate);
    const day = ("0" + dateObj.getDate()).slice(-2);
    const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();
    const hours = ("0" + dateObj.getHours()).slice(-2);
    const minutes = ("0" + dateObj.getMinutes()).slice(-2);
    let separator = " ";
    switch (bosluk) {
        case "br":
            separator = "<br>";
            break;
        case "hr":
            separator = "<hr>";
            break;
        default:
            separator = " ";
    }
    return `${day}.${month}.${year}${separator}${hours}:${minutes}`;
}

export function trTarih(tarih:Date=new Date()) {
    const options:Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return tarih.toLocaleDateString("tr-TR", options )
}
export function trSaat(tarih:Date=new Date(), saniyeEkle:boolean = false) {
    const options:Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric'
    };
    if(saniyeEkle) options.second = 'numeric';
    return tarih.toLocaleTimeString("tr-TR", options )
}

export function trTamTarih(tarih:Date=new Date()) {
    const options:Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    };
    return tarih.toLocaleString("tr-TR", options )
}

//Sql tarih formatı
export function sqlTarih(tarih=new Date()) {
    const tamTarih = sqlTamTarih(tarih);
    let [trh, st] = tamTarih.split(" "); //tarih ve saat ile ayırıyoruz.
    let [HH, MM, SS] = st.split(":");
    return `${trh} ${HH}:${MM}`;
}
export function sqlTamTarih(tarih=new Date()) {
    const yyyy = tarih.getFullYear();
    const mm = String(tarih.getMonth() + 1).padStart(2, '0'); // Aylar 0'dan başladığı için 1 ekliyoruz
    const dd = String(tarih.getDate()).padStart(2, '0');
    const HH = String(tarih.getHours()).padStart(2, '0');
    const MM = String(tarih.getMinutes()).padStart(2, '0');
    const SS = String(tarih.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}
export function sqlTarihSaatsiz(tarih=new Date()) {
    return sqlTarih(tarih).split(" ")[0];
}
export function sqlSaat(tarih=new Date()) {
    return sqlTarih(tarih).split(" ")[1];
}
//ChartJS için lazım
export function noktaliTarih(tarih:string){
    const dateObj = new Date(tarih);
    const gun = String(dateObj.getDate()).padStart(2, '0');
    const ay = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yil = dateObj.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

//Alarm oluştururken kullanılıyor
export function tariheSaatEkle(date: Date, hours: string|number, minutes: string|number=0): Date {
    hours = Number(hours);
    minutes = Number(minutes);
    let resetDate = new Date(date);
    resetDate.setHours(0, 0, 0, 0); // Saat, dakika, saniye ve milisaniye sıfırlanır
    resetDate.setHours(resetDate.getHours() + hours);
    resetDate.setMinutes(resetDate.getMinutes() + minutes);
    return resetDate;
}

export function tarihKiyasla( a:any, b:any ) {
    if(!a.tarih || !b.tarih) return 0;
    let t1 = new Date(a.tarih);
    let t2 = new Date(b.tarih);
    if ( t1 < t2 ){
        return -1;
    }
    if ( t1 > t2 ){
        return 1;
    }
    return 0;
}

//PHP'den gelen veri için
export function unixToDate(timestamp: number): Date {
    return (new Date(timestamp * 1000));
}

export function formatTarih(tarih:string) {
    return ilkharf(moment(tarih, 'YYYY-MM-DD HH:mm').fromNow());
};