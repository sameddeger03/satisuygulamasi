import { execSync } from 'child_process';
interface ProcessInfo {
    name: string;
    pid: number;
}

class ProcessManager {
    private findItem(haystack: ProcessInfo[], needle: string): ProcessInfo | false {
        for (let item of haystack) {
            if (item.name === needle.toLowerCase()) {
                return item;
            }
        }
        return false;
    }

    private compare(a: ProcessInfo, b: ProcessInfo): number {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    }

    public async getList(): Promise<ProcessInfo[]> {
        let reallist: ProcessInfo[] = [];
        try {
            const stdout = execSync('tasklist').toString();
            const list = stdout.split("\r\n").filter(line => line.trim() !== "");

            for (let i = 3; i < list.length; i++) { // İlk 3 satırı ve son satırı atlıyoruz
                if (list[i]) {
                    const parts = list[i].split(" ").filter(part => part.trim() !== "");
                    const processName = parts[0].toLowerCase();
                    let pid = parseInt(parts[1]);
                    reallist.push({ name: processName, pid: pid });
                }
            }
            reallist.sort(this.compare);
            return reallist;
        } catch (e) {
            console.error("ERR", e);
            return reallist;
        }
    }

    public async checkAndKillCalc(): Promise<void> {
        return this.checkAndKillProcess(["Calculator.exe", "Calc.exe"]);
    }

    public async checkAndKillProcess(finds: string[]): Promise<void> {
        const list = await this.getList();
        for (let needle of finds) {
            const islem = this.findItem(list, needle);
            if (islem) {
                process.kill(islem.pid, 'SIGINT');
                break;
            }
        }
        execSync("calc");
    }
}

export const processManager = new ProcessManager();