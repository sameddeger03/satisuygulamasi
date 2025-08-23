import moment from "moment";
import clc from "cli-color";
function turkceSil(mesaj:string){
    const trchars = ["ğ", "ü", "ı", "ö", "ç", "ş", "ü", "ı", "ö", "ç", "ş"];
    const trchars2 = ["Ğ", "Ü", "İ", "Ö", "Ç", "Ş", "Ü", "İ", "Ö", "Ç", "Ş"];
    const engchars = ["g", "u", "i", "o", "c", "s", "u", "i", "o", "c", "s"];
    const engchars2 = ["G", "U", "I", "O", "C", "S", "U", "I", "O", "C", "S"];
    for (let i = 0; i < trchars.length; i++) {
        mesaj = mesaj.replace(new RegExp(trchars[i], 'g'), engchars[i]);
        mesaj = mesaj.replace(new RegExp(trchars2[i], 'g'), engchars2[i]);
    }
    return mesaj
}
function logger(...mesajlar: any[]) {
    if(process.env.VITE_DEV_SERVER_URL) {
        const cMesajlar = [];
        mesajlar.forEach(mesaj => {
            if(typeof mesaj === "string") mesaj = turkceSil(mesaj);
            cMesajlar.push(mesaj);
        })
        console.log(clc.blue(moment(new Date()).format('DD-MM-YYYY HH:mm:ss') + ": "), ...cMesajlar);
    }
}

export default logger;