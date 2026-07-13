<script setup lang="ts">
import { ref, watch } from "vue";
import EquipmentModel from "./components/EquipmentModel.vue";

// 预设布局选项
const presets = [
  { label: "1宫格", cols: 1, count: 1 },
  { label: "4宫格", cols: 2, count: 4 },
  { label: "9宫格", cols: 3, count: 9 },
];

const currentLayout = ref(presets[0]);
const customCount = ref<number>();
const isCustomMode = ref(false);

// 已创建的组件数量（只增不减）
const createdCount = ref(1);

// 根据数量自动计算行列（尽量接近正方形）
const calculateGrid = (count: number) => {
  return Math.ceil(Math.sqrt(count));
};

// 选择预设布局
const selectPreset = (layout: (typeof presets)[number]) => {
  currentLayout.value = layout;
  isCustomMode.value = false;
  customCount.value = undefined;
  // 更新已创建数量
  if (layout.count > createdCount.value) {
    createdCount.value = layout.count;
  }
};

// 应用自定义数量
const applyCustom = () => {
  const count = customCount.value;
  if (!count || count < 1) return;

  const cols = calculateGrid(count);
  currentLayout.value = {
    label: `自定义(${count})`,
    cols,
    count: cols * Math.ceil(count / cols),
  };
  isCustomMode.value = true;
  // 更新已创建数量
  if (currentLayout.value.count > createdCount.value) {
    createdCount.value = currentLayout.value.count;
  }
};

// 生成已创建组件的列表
const getCreatedItems = () => Array.from({ length: createdCount.value }, (_, i) => i + 1);
</script>

<template>
  <div class="app-container">
    <!-- 布局选择器 -->
    <div class="layout-selector">
      <button v-for="layout in presets" :key="layout.label"
        :class="{ active: !isCustomMode && currentLayout.label === layout.label }" @click="selectPreset(layout)">
        {{ layout.label }}
      </button>

      <div class="custom-input">
        <input v-model.number="customCount" type="number" min="1" placeholder="自定义数量" @keyup.enter="applyCustom" />
        <button :class="{ active: isCustomMode }" @click="applyCustom">应用</button>
      </div>
    </div>

    <!-- 宫格容器 - 已创建的组件不会销毁 -->
    <div class="grid-container" :style="{
      gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
      gridTemplateRows: `repeat(${Math.ceil(currentLayout.count / currentLayout.cols)}, 1fr)`,
    }">
      <div v-for="item in getCreatedItems()" :key="item" class="grid-item"
        :class="{ hidden: item > currentLayout.count }">
        <EquipmentModel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.layout-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #16213e;
  flex-shrink: 0;
}

.layout-selector button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #0f3460;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-selector button:hover {
  background: #1e5f8a;
}

.layout-selector button.active {
  background: #1e9cff;
}

.custom-input {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
}

.custom-input input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #1a1a2e;
  color: #fff;
  font-size: 14px;
}

.custom-input input::-webkit-inner-spin-button,
.custom-input input::-webkit-outer-spin-button {
  opacity: 1;
}

.custom-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.grid-container {
  flex: 1;
  display: grid;
  gap: 2px;
  overflow: hidden;
}

.grid-item {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.grid-item.hidden {
  display: none;
}
</style>