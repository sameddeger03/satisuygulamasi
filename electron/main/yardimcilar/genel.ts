import { promises as fs } from 'fs';

import * as os from 'os';
import * as path from 'path';
import logger from "../logger";

export function idOlustur(id) {
    return id
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Türkçe karakterleri kaldırma
        .replace(/[^a-z0-9]/g, ""); // Özel karakterleri kaldırma
}
export function sifreOlustur(uzunluk=10){
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < uzunluk; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}
export async function geciciDosya(prefix: string): Promise<string> {
    const tempDir = os.tmpdir();
    const fileName = `${prefix}-${Date.now()}`;
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, ''); // Boş bir dosya oluşturmak
    logger(`Temp file created at: ${filePath}`);
    return filePath;
}

export async function bekleVeSil(filePath: string, retryDelay: number = 1000, maxRetries: number = 10) {
    let retries = 0;

    async function tryDelete() {
        try {
            await fs.unlink(filePath);
            logger('Dosya başarıyla silindi.');
        } catch (err) {
            if (err.code === 'EBUSY') {
                if (retries < maxRetries) {
                    retries++;
                    logger(`Dosya meşgul, ${retryDelay} ms sonra tekrar denenecek... (${retries}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    await tryDelete();  // Tekrar deneme
                } else {
                    console.error('Maksimum deneme sayısına ulaşıldı, dosya silinemiyor.');
                }
            } else {
                console.error('Dosya silinirken hata oluştu:', err);
            }
        }
    }
    await tryDelete();
}

export function duzgunSirketAdi(str: string) {
    return str
        .trim() // Başındaki ve sonundaki boşlukları temizle
        .toLowerCase() // Tüm karakterleri küçük harfe dönüştür
        .split(/\s+/)  // Stringi kelimelerine ayır (bir veya daha fazla boşluğa göre)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Her kelimenin ilk harfini büyük yap
        .join(' ');    // Kelimeleri tekrar birleştir
}
