import {govde} from "./govde";
import {kontrol} from "./kontrol";
import {urunler} from "./urun";
import {kategoriler} from "./kategori";
import {odemeler} from "./odeme";
import {iadeler} from "./iade";
import {ayar} from "./ayar";
import {gunSonuRaporu} from "./gunSonu";
import {planlar} from "./plan";
import {notlar} from "./notdefteri";
import {yedek} from "./yedek";
import {copkutusu} from "./copkutusu";
import vt from "../islemciler/veritabani";
import {App, BrowserWindow} from "electron";

class Dinleme {
    basla(uygulama:App,pencere:BrowserWindow, veritabani:vt) {
        new govde(pencere, uygulama);
        new kontrol(veritabani);
        new ayar(veritabani);
        new urunler(veritabani);
        new kategoriler(veritabani);
        new odemeler(veritabani);
        new iadeler(veritabani);
        new gunSonuRaporu(veritabani);
        new planlar(veritabani);
        new notlar(veritabani);
        new yedek(veritabani);
        new copkutusu(veritabani);
    }
}
export default Dinleme;