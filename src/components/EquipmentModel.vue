<template>
  <div id="uploader">
    <div
      class="file-preview"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      :class="{ 'drag-over': isDragOver }"
    >
      <span v-if="!currentFile">拖拽GLB文件到此处</span>
    </div>
    <div class="file-info">
      <div class="file-name">文件路径：{{ filePath || "未选择文件" }}</div>
    </div>
  </div>
  <div ref="modelContainerRef" class="model-container"></div>
</template>

<script setup lang="ts">
defineOptions({ name: "EquipmentModel" });
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  computed,
} from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Props {
  autoRotate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoRotate: false,
});

// 从store中获取设备名称和模型URL
const equipmentName = computed(() => {
  return "设备模型";
});

const modelUrl = computed(() => {
  return "http://10.143.232.32:10065/szls-glbs/GYGC/GYGC_JZ06.glb";
});

const modelContainerRef = ref<HTMLElement | null>(null);
const isDragOver = ref(false);
const currentFile = ref<File | null>(null);
const filePath = ref("");
let objectUrl: string | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let animationId: number | null = null;
let model: THREE.Object3D | null = null;

const initModel = () => {
  if (!modelContainerRef.value) return;

  const container = modelContainerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1628);

  // 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(3, 2, 3);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = props.autoRotate;
  controls.autoRotateSpeed = 1.0;

  // 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-5, -5, -5);
  scene.add(directionalLight2);

  // 加载模型
  if (modelUrl.value) {
    loadModel(modelUrl.value);
  } else {
    // 默认加载一个简单几何体作为占位
    createPlaceholderModel();
  }

  // 动画循环
  animate();
};

const loadModel = (url: string) => {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      if (model) {
        scene!.remove(model);
        // 释放旧模型的几何体和材质
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }
      model = gltf.scene;

      // 自动调整模型大小和位置
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);

      // 重新计算缩放后的包围盒
      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.sub(scaledCenter);

      scene!.add(model);

      // 调整相机位置
      camera!.position.set(2, 1.5, 2);
      camera!.lookAt(0, 0, 0);
      controls!.update();
    },
    undefined,
    (error) => {
      console.error("加载GLB模型失败:", error);
      createPlaceholderModel();
    },
  );
};

// 从 ArrayBuffer 加载模型
const loadModelFromArrayBuffer = (arrayBuffer: ArrayBuffer) => {
  const loader = new GLTFLoader();
  loader.parse(
    arrayBuffer,
    "",
    (gltf) => {
      if (model) {
        scene!.remove(model);
        // 释放旧模型的几何体和材质
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }
      model = gltf.scene;

      // 自动调整模型大小和位置
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);

      // 重新计算缩放后的包围盒
      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.sub(scaledCenter);

      scene!.add(model);

      // 调整相机位置
      camera!.position.set(2, 1.5, 2);
      camera!.lookAt(0, 0, 0);
      controls!.update();
    },
    (error) => {
      console.error("解析GLB模型失败:", error);
      createPlaceholderModel();
    },
  );
};

const createPlaceholderModel = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1e9cff,
    metalness: 0.5,
    roughness: 0.3,
  });
  model = new THREE.Mesh(geometry, material);
  scene!.add(model);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls?.update();
  renderer?.render(scene!, camera!);
};

const handleResize = () => {
  if (!modelContainerRef.value || !renderer || !camera) return;
  const width = modelContainerRef.value.clientWidth;
  const height = modelContainerRef.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

// 拖拽事件处理
const onDragOver = (e: DragEvent) => {
  isDragOver.value = true;
};

const onDragLeave = (e: DragEvent) => {
  isDragOver.value = false;
};

const onDrop = async (e: DragEvent) => {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.name.toLowerCase().endsWith(".glb")) {
    alert("请上传GLB格式的文件");
    return;
  }

  currentFile.value = file;

  // 判断是否在 Electron 环境中
  if (window.electronAPI) {
    // Electron 中 File 对象有 path 属性，可获取绝对路径
    const absPath = (file as any).path as string;

    if (!absPath) {
      // 降级：使用 Blob URL 方式
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrl = URL.createObjectURL(file);
      filePath.value = file.name;
      if (scene) {
        loadModel(objectUrl);
      }
      return;
    }

    filePath.value = absPath;

    try {
      // 检查缓存
      const cacheResult = await window.electronAPI.checkGlbCache(absPath);

      if (cacheResult.cached && cacheResult.filePath) {
        // 使用缓存：直接从本地读取文件
        const arrayBuffer = await window.electronAPI.readGlbFile(
          cacheResult.filePath,
        );
        if (scene) {
          loadModelFromArrayBuffer(arrayBuffer);
        }
      } else {
        // 文件已修改或首次加载：读取并缓存
        const arrayBuffer = await window.electronAPI.readGlbFile(absPath);
        if (scene) {
          loadModelFromArrayBuffer(arrayBuffer);
        }
      }
    } catch (error) {
      console.error("加载本地GLB文件失败:", error);
      alert("加载文件失败，请检查文件是否存在");
    }
  } else {
    // 浏览器环境：使用 Blob URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    objectUrl = URL.createObjectURL(file);
    filePath.value = file.name;
    if (scene) {
      loadModel(objectUrl);
    }
  }
};

let resizeObserver: ResizeObserver | null = null;

// 监听modelUrl变化，重新加载模型
watch(modelUrl, (newUrl) => {
  if (newUrl && scene) {
    loadModel(newUrl);
  } else if (scene && !newUrl) {
    createPlaceholderModel();
  }
});

onMounted(() => {
  nextTick(() => {
    initModel();
    resizeObserver = new ResizeObserver(handleResize);
    if (modelContainerRef.value) {
      resizeObserver.observe(modelContainerRef.value);
    }
  });
});

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (controls) {
    controls.dispose();
  }
  if (renderer) {
    renderer.dispose();
    if (
      modelContainerRef.value &&
      renderer.domElement.parentNode === modelContainerRef.value
    ) {
      modelContainerRef.value.removeChild(renderer.domElement);
    }
  }
  renderer = null;
  scene = null;
  camera = null;
  controls = null;
  model = null;
});
</script>

<style scoped lang="less">
.model-content {
  padding: 0;
}

.model-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #0a1628;
  border-radius: 4px;
  overflow: hidden;
}

#uploader {
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  width: 800px;
  height: 400px;
  z-index: 9999;
  background: rgba(214, 214, 214, 0.09);
  color: #fff;

  .file-preview {
    width: 100%;
    height: calc(100% - 40px);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;

    &.drag-over {
      border-color: #1e9cff;
      background: rgba(30, 156, 255, 0.1);
    }

    span {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }
  }

  .file-info {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 16px;

    .file-name {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
