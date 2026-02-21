const SECRET_KEY = 'TransportTycoon2024SecretKey'

export function encryptData(data) {
  try {
    const jsonString = JSON.stringify(data)
    let encrypted = ''
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
      encrypted += String.fromCharCode(charCode)
    }
    return btoa(encodeURIComponent(encrypted))
  } catch (error) {
    console.error('加密失败:', error)
    return null
  }
}

export function decryptData(encrypted) {
  try {
    const decoded = decodeURIComponent(atob(encrypted))
    let decrypted = ''
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
      decrypted += String.fromCharCode(charCode)
    }
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}