import { net } from 'electron';
import logger from "../logger";
let sonPingSonuc = false;
let sonPingSonuc2 = false;
import isOnline from 'is-online';


export class internet {

    private zamanlayici;

    constructor() {
        sonPingSonuc = false;
        sonPingSonuc2 = false;
    }

    zamanla():void {
        this.zamanlaDurdur()
        this.zamanlayici = setInterval(() => {
            this.test().then(r => {});
        }, 1000);
    }

    zamanlaDurdur(): void {
        if(this.zamanlayici) clearTimeout(this.zamanlayici);
    }

    ping(): Promise<boolean> {
        return new Promise((resolve) => {
            isOnline().then(r => {
                resolve(r);
            })
        });
    }
    ping2(): Promise<boolean> {
        return new Promise((resolve) => {
            const request = net.request('http://apps.rovave.com');
            request.on('response', (response) => {
                if (response.statusCode === 200) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
            request.on('error', () => resolve(false));
            request.end();
        });
    }
    async test(): Promise<boolean[]> {
        let testSonuc: boolean = false;
        let testSonuc2: boolean = false;
        try {
            testSonuc = await this.ping();
            testSonuc2 = await this.ping2();
        } catch (error) {
            logger('Error checking internet connection:', error);
        }
        sonPingSonuc = testSonuc;
        sonPingSonuc2 = testSonuc2;
        return [testSonuc,testSonuc2];
    }
    sonPing(i:number): boolean|boolean[] {
        if(i==1)
            return sonPingSonuc;
        else if(i==2)
            return sonPingSonuc2;
        else return [sonPingSonuc,sonPingSonuc2];
    }
}