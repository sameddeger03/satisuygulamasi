
class modalpencere {
    modalList: Record<string,any> = {};
    constructor() {
        setInterval(()=>{
            if(typeof document !== "undefined") {
                let kararti = document.getElementById("kararti");
                if(kararti && kararti.style.display == "block") {
                    for (let id in this.modalList) {
                        if (this.modalList[id]) {
                            let acikmi = document.getElementById(id);
                            if (acikmi && acikmi.style.display == ""){
                                this.modalList[id] = false;
                                kararti.style.display = "none";
                            }
                        }
                    }
                }
            }
        },500)
    }
    ac(id: string) {
        if(this.modalList[id]) return;
        let bul = document.getElementById(id);
        let kararti = document.getElementById("kararti");
        if(bul) {
            bul.style.display = "block";
            this.modalList[id] = true;
            if(kararti) kararti.style.display = "block";
        }
    }
    kapat(id: string) {
        if(!this.modalList[id]) return;
        let bul = document.getElementById(id);
        let kararti = document.getElementById("kararti");
        if(bul) {
            bul.style.display = "none";
            this.modalList[id] = false;
            if(kararti) kararti.style.display = "none";
        }
    }
}

export const mpen = new modalpencere();