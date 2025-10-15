// shallow diff por claves (soporta objetos y arrays simples)
export function diff(a, b) {
    const out = {};
    const aKeys = new Set(Object.keys(a || {}));
    const bKeys = new Set(Object.keys(b || {}));
    const keys = new Set([...aKeys, ...bKeys]);
    for (const k of keys) {
        const pa = a?.[k], pb = b?.[k];
        if (Array.isArray(pa) || Array.isArray(pb)) {
            const sa = JSON.stringify(pa ?? []), sb = JSON.stringify(pb ?? []);
            if (sa !== sb) out[k] = pb;
        } else if (isPlainObject(pa) || isPlainObject(pb)) {
            const d = diff(pa || {}, pb || {});
            if (Object.keys(d).length) out[k] = d;
        } else if (pa !== pb) out[k] = pb;
    }
    return out;
}
export function isPlainObject(o) {
    return o && typeof o === "object" && !Array.isArray(o);
}
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
