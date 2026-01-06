
import fs from 'fs';
import path from 'path';

const filePath = 'c:\\Users\\WindowS 10.ROWAND-PC\\Desktop\\Sahl-erp\\lib\\translations.ts';
const content = fs.readFileSync(filePath, 'utf-8');

// Simple regex based sanitizer
function sanitize(content) {
    // Extract TranslationKeys interface
    const interfaceMatch = content.match(/export interface TranslationKeys {([\s\S]*?)}/);
    if (!interfaceMatch) return content;

    let interfaceKeys = interfaceMatch[1].split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    let uniqueInterfaceKeys = Array.from(new Set(interfaceKeys.map(k => k.split(':')[0].trim())));

    let newInterface = 'export interface TranslationKeys {\n';
    uniqueInterfaceKeys.forEach(key => {
        newInterface += `  ${key}: string\n`;
    });
    newInterface += '}';

    // Extract en and ar objects
    const enMatch = content.match(/en: {([\s\S]*?)},\s*ar: {/);
    const arMatch = content.match(/ar: {([\s\S]*?)}\s*}\s*}/);

    if (!enMatch || !arMatch) return content;

    let enKeys = enMatch[1].split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    let arKeys = arMatch[1].split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));

    let enMap = new Map();
    enKeys.forEach(line => {
        let parts = line.split(':');
        if (parts.length >= 2) {
            let key = parts[0].trim();
            let val = parts.slice(1).join(':').trim();
            enMap.set(key, val);
        }
    });

    let arMap = new Map();
    arKeys.forEach(line => {
        let parts = line.split(':');
        if (parts.length >= 2) {
            let key = parts[0].trim();
            let val = parts.slice(1).join(':').trim();
            arMap.set(key, val);
        }
    });

    let newEn = '  en: {\n';
    enMap.forEach((val, key) => {
        newEn += `    ${key}: ${val}\n`;
    });
    newEn += '  },';

    let newAr = '  ar: {\n';
    arMap.forEach((val, key) => {
        newAr += `    ${key}: ${val}\n`;
    });
    newAr += '  }';

    let result = content.replace(/export interface TranslationKeys {[\s\S]*?}/, newInterface);
    result = result.replace(/en: {[\s\S]*?},\s*ar: {[\s\S]*?}/, newEn + '\n' + newAr);

    return result;
}

const sanitizedContent = sanitize(content);
fs.writeFileSync(filePath, sanitizedContent);
console.log('Sanitization complete');
