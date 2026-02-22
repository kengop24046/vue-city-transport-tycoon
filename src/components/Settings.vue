<template>
  <div class="settings">
    <h2>⚙️ 游戏设置</h2>
    
    <div class="settings-section">
      <h3>💾 存档管理</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <h4>导出存档</h4>
          <p>将游戏存档导出为 JSON 文件</p>
        </div>
        <button class="action-btn export" @click="exportSave">
          📤 导出
        </button>
      </div>
      
      <div class="setting-item">
        <div class="setting-info">
          <h4>导入存档</h4>
          <p>从 JSON 文件导入游戏存档</p>
        </div>
        <div class="import-section">
          <input 
            type="file" 
            ref="fileInput"
            accept=".json"
            @change="importSave"
            style="display: none"
          />
          <button class="action-btn import" @click="fileInput.click()">
            📥 导入
          </button>
        </div>
      </div>
      
      <div class="setting-item">
        <div class="setting-info">
          <h4>手动保存</h4>
          <p>立即保存当前游戏进度</p>
        </div>
        <button class="action-btn save" @click="saveGame">
          💾 保存
        </button>
      </div>
    </div>

    <div class="settings-section danger">
      <h3>⚠️ 危险区域</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <h4>重置游戏</h4>
          <p>清除所有数据，重新开始游戏</p>
        </div>
        <button class="action-btn reset" @click="showResetConfirm = true">
          🔄 重置
        </button>
      </div>
    </div>

    <div class="settings-section">
      <h3>ℹ️ 游戏信息</h3>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">游戏版本</span>
          <span class="info-value">1.0.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">公司等级</span>
          <span class="info-value">{{ companyLevel }} / 30</span>
        </div>
        <div class="info-item">
          <span class="info-label">解锁城市</span>
          <span class="info-value">{{ unlockedCities.length }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">员工总数</span>
          <span class="info-value">{{ totalEmployees }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">最后保存</span>
          <span class="info-value">{{ formatTime(lastSaveTime) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">自动保存</span>
          <span class="info-value">每 30 秒</span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>🎮 游戏说明</h3>
      
      <div class="help-content">
        <h4>🚀 游戏目标</h4>
        <p>建立你的交通帝国！从澳门的一条巴士线路开始，逐步扩展到飞机、地铁、高铁，覆盖全中国！</p>
        
        <h4>💰 赚钱技巧</h4>
        <ul>
          <li>开通更多线路，增加运力</li>
          <li>为车辆升级娱乐系统和WiFi，增加额外收入</li>
          <li>投放共享单车，获得稳定收入</li>
          <li>离线也能获得收益，记得经常回来看看！</li>
        </ul>
        
        <h4>🎯 等级解锁</h4>
        <ul>
          <li><strong>1级</strong> - 巴士、共享单车</li>
          <li><strong>6级</strong> - 飞机</li>
          <li><strong>10级</strong> - 解锁地铁系统</li>
          <li><strong>20级</strong> - 解锁高铁系统</li>
          <li><strong>30级</strong> - 最高等级，成为交通大亨！</li>
        </ul>

         <h4>👻开源地址</h4>
        <ul>
          <li>https://github.com/kengop24046/vue-city-transport-tycoon</li>
        </ul>
      </div>
    </div>

    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal">
        <h3>⚠️ 确认重置游戏？</h3>
        <p>此操作将清除所有游戏数据，无法恢复！</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showResetConfirm = false">取消</button>
          <button class="modal-btn confirm" @click="resetGame">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { saveSystem } from '../utils/saveSystem'

export default {
  name: 'Settings',
  setup() {
    const store = useStore()
    const fileInput = ref(null)
    const showResetConfirm = ref(false)

    const companyLevel = computed(() => store.state.companyLevel)
    const unlockedCities = computed(() => store.state.unlockedCities)
    const lastSaveTime = computed(() => store.state.lastSaveTime)
    const employees = computed(() => store.state.employees)
    
    const totalEmployees = computed(() => {
      let count = 0
      Object.values(employees.value).forEach(type => {
        count += type.filter(e => e.hired).length
      })
      return count
    })
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return date.toLocaleString('zh-CN')
    }
    
    const exportSave = () => {
      saveSystem.exportSave(store.state)
    }
    
    const importSave = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        const importedState = await saveSystem.importSave(file)
        store.commit('LOAD_STATE', importedState)
        store.dispatch('saveGame')
        alert('✅ 存档导入成功！')
      } catch (error) {
        alert('❌ 存档导入失败：' + error.message)
      }
      
      event.target.value = ''
    }
    
    const saveGame = () => {
      store.dispatch('saveGame')
      alert('✅ 游戏已保存！')
    }
    
    const resetGame = () => {
      store.dispatch('resetGame')
      showResetConfirm.value = false
      alert('🔄 游戏已重置！')
    }

    return {
      fileInput,
      showResetConfirm,
      companyLevel,
      unlockedCities,
      lastSaveTime,
      totalEmployees,
      formatTime,
      exportSave,
      importSave,
      saveGame,
      resetGame
    }
  }
}
</script>

<style scoped>
.settings h2 {
  margin: 0 0 25px 0;
  color: #333;
  font-size: 24px;
}

.settings-section {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 25px;
}

.settings-section.danger {
  background: #ffebee;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.settings-section.danger h3 {
  color: #d32f2f;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.setting-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.export {
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  color: white;
}

.action-btn.import {
  background: linear-gradient(135deg, #2196f3, #03a9f4);
  color: white;
}

.action-btn.save {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.action-btn.reset {
  background: linear-gradient(135deg, #f44336, #e91e63);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 15px;
  background: white;
  border-radius: 10px;
}

.info-label {
  font-size: 12px;
  color: #888;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.help-content h4 {
  margin: 20px 0 10px 0;
  color: #333;
  font-size: 16px;
}

.help-content h4:first-child {
  margin-top: 0;
}

.help-content p {
  margin: 0 0 10px 0;
  color: #555;
  line-height: 1.6;
}

.help-content ul {
  margin: 0;
  padding-left: 20px;
}

.help-content li {
  margin: 8px 0;
  color: #555;
  line-height: 1.6;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal h3 {
  margin: 0 0 15px 0;
  color: #d32f2f;
  font-size: 20px;
}

.modal p {
  margin: 0 0 25px 0;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn.cancel {
  background: #e0e0e0;
  color: #333;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #f44336, #e91e63);
  color: white;
}

.modal-btn:hover {
  transform: translateY(-2px);
}
</style>