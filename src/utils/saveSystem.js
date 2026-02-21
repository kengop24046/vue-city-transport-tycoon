import { encryptData, decryptData } from './encryption'

export const saveSystem = {
  exportSave(state) {
    try {
      const dataToExport = {
        ...state,
        exportTime: Date.now(),
        version: '1.0.0'
      }
      const encrypted = encryptData(dataToExport)
      const blob = new Blob([encrypted], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transport_tycoon_save_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('导出失败:', error)
      return false
    }
  },
  
  async importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const decrypted = decryptData(content)
          if (decrypted && decrypted.money !== undefined) {
            resolve(decrypted)
          } else {
            reject(new Error('无效的存档文件'))
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }
}