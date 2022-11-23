// https://stackoverflow.com/a/43467144
function isValidHttpUrl(url: string) {
    let _url;
    try {
        _url = new URL(url);
    } catch (_) {
        return false;
    }
    return _url.protocol === "http:" || _url.protocol === "https:";
}

export {
    isValidHttpUrl
}