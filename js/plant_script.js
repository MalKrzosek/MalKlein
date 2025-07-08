// plant_script.js

let scene, camera, renderer, controls, mixer;
let growModel, bloomModel;
let growActions = {}, bloomActions = {};
let bloomMixer;
let isWireframe = false;

// Expose functions for inline onclick handlers
window.playGrow = playGrow;
window.playBloom = playBloom;

window.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
  setupWireframeToggle();
});

function setupWireframeToggle() {
  const button = document.getElementById("toggleWireframe");
  if (!button) {
    console.error("Wireframe button not found!");
    return;
  }
  button.addEventListener("click", () => {
    isWireframe = !isWireframe;
    [growModel, bloomModel].forEach(model => {
      if (!model) return;
      model.traverse(child => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach(mat => mat.wireframe = isWireframe);
        }
      });
    });
  });
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.TextureLoader().load(
    './assets/images/flowerbackground.jpg'
  );

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, -1, 8);
  camera.lookAt(0, -0.4, 0);

  const canvas = document.getElementById("plantCanvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  window.addEventListener('resize', onWindowResize);
  onWindowResize();
  preloadModels();
}

function onWindowResize() {
  const canvas = document.getElementById('plantCanvas');
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function preloadModels() {
  const loader = new THREE.GLTFLoader();

  // Grow model (local)
  loader.load(
    './assets/models/grow_plant.glb',
    gltf => {
      growModel = gltf.scene;
      growModel.position.set(0, -3.8, 0);
      growModel.scale.set(1.3, 1.3, 1.3);
      growModel.visible = true;
      growModel.traverse(child => {
        if (child.isMesh) {
          child.material.metalness = 0.4;
          child.material.roughness = 0;
          child.material.envMapIntensity = 1.7;
          child.material.needsUpdate = true;
        }
      });
      scene.add(growModel);
      mixer = new THREE.AnimationMixer(growModel);
      gltf.animations.forEach(clip => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        growActions[clip.name] = clip;
      });
    },
    xhr => {
      const pct = xhr.total
        ? (xhr.loaded / xhr.total * 100).toFixed(1)
        : 'unknown';
      console.log(`Grow model: ${pct}% loaded`);
    },
    err => console.error('Error loading grow model:', err)
  );

  // Bloom model (GitHub Releases)
  loader.load(
    'https://github.com/MalKrzosek/MalKlein/releases/download/v1.0-models/bloom_plant.glb',
    gltf => {
      bloomModel = gltf.scene;
      bloomModel.position.set(0, -3.8, 0);
      bloomModel.scale.set(1.3, 1.3, 1.3);
      bloomModel.visible = false;
      bloomModel.traverse(child => {
        if (child.isMesh) {
          child.material.metalness = 0.4;
          child.material.roughness = 0;
          child.material.envMapIntensity = 1.7;
          child.material.needsUpdate = true;
        }
      });
      scene.add(bloomModel);
      bloomMixer = new THREE.AnimationMixer(bloomModel);
      bloomActions = {};
      gltf.animations.forEach(clip => {
        const action = bloomMixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        bloomActions[clip.name] = action;
      });
    },
    xhr => {
      const pct = xhr.total
        ? (xhr.loaded / xhr.total * 100).toFixed(1)
        : 'unknown';
      console.log(`Bloom model: ${pct}% loaded`);
    },
    err => console.error('Error loading bloom model:', err)
  );
}

function playGrow() {
  if (!growModel || Object.keys(growActions).length === 0) return;
  growModel.visible = true;
  if (bloomModel) bloomModel.visible = false;
  mixer = new THREE.AnimationMixer(growModel);
  Object.values(growActions).forEach(clip => {
    const action = mixer.clipAction(clip);
    action.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
    action.play();
  });
  const sound = document.getElementById('growSound');
  if (sound) { sound.currentTime = 0; sound.play(); }
}

function playBloom() {
  if (!bloomModel || Object.keys(bloomActions).length === 0) return;
  bloomModel.visible = true;
  if (growModel) growModel.visible = false;
  mixer = bloomMixer;
  Object.values(bloomActions).forEach(action => action.reset().play());
  const sound = document.getElementById('bloomSound');
  if (sound) { sound.currentTime = 0; sound.play(); }
}

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.016);
  renderer.render(scene, camera);
}
