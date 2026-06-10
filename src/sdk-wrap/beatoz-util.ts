

export function with0xPrefix(data: string) {
    return data.startsWith('0x') ? data : `0x${data}`
}