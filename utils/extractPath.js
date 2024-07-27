export default function extractPath(url, path) {
    const startIndex = url.indexOf(path);
    if (startIndex !== -1) {
        return url.substring(startIndex);
    }
    return url;
}
