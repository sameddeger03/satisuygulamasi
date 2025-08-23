const turklira = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
});
export function turklirasi(num:number,kurusduz:boolean = false, isaretsil=false) {
    let sonuc  = "0";
    if(kurusduz)
        sonuc = turklira.format(kurusDuzelt(num));
    else
        sonuc = turklira.format(num);
    if(isaretsil) sonuc = sonuc.replace("₺","");
    return sonuc;
}
export function kurusDuzelt(amount:number):number {
    if(amount <= 0) return 0.00;
    let lira = Math.floor(amount);
    let kurus = Math.round((amount - lira) * 100);
    let roundedKurus = Math.round(kurus / 5) * 5;
    if (roundedKurus === 100) {
        lira += 1;
        roundedKurus = 0;
    }
    return parseFloat(`${lira}.${roundedKurus.toString().padStart(2, '0')}`);
}


export function inputDegeri(id:string){
    if(!document.getElementById(id)) return "";
    return (document.getElementById(id) as HTMLInputElement).value
}

export function isNumeric(value:string|number) {
    return /^-?\d+(\.\d+)?$|^-?\d+(\\,\d+)?$/.test(value.toString());
}
let uids:string[] = [];
export function uidolustur(prefix:string="obj"):string {
    let test = `${prefix}-${Math.floor(Math.random() * 100000)}`
    while (uids.includes(test)) {
        test = `${prefix}-${Math.floor(Math.random() * 100000)}`
    }
    uids.push(test)
    return test
}

export function objele(obj:object) {
    return JSON.parse(JSON.stringify(obj))
}

export function ToLowerCaseTR(str:string) {
    const regex = /[İIŞĞÜÇÖ]/g;
    const letters:Record<string,string> = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
    str = str.replace(regex, (letter:string) => letters[letter]);
    return str.toLowerCase();
}

export function turunuBelirle(deger:string|number|Date):string {
    if (typeof deger === 'number') {
        return 's';
    } else if (typeof deger === 'string') {
        if(!isNaN(Number(deger))) return 's';
        else return "m";
    } else if (isValidDate(deger)) {
        return 't';
    } else {
        return 'm';
    }
}

export function isValidDate(deger:string|Date) {
    let date:Date;
    if(typeof deger === "object") date= deger;
    else date = new Date(deger);
    return !isNaN(date.getTime());
}

export function renkuydur() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}
export function ilkharf(val:string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}