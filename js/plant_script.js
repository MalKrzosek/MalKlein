// plant_script.js

let scene, camera, renderer, controls, mixer;
let growModel, bloomModel;
let growActions = {}, bloomActions = {};
let bloomMixer;
let isWireframe = false;  // shared flag

window.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
  setupWireframeToggle();

  // wire up Grow/Bloom buttons
  const growBtn = document.getElementById("growButton");
  const bloomBtn = document.getElementById("bloomButton");
  if (growBtn)  growBtn.addEventListener("click", playGrow);
  if (bloomBtn) bloomBtn.addEventListener("click", playBloom);
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
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.wireframe = isWireframe);
          } else {
            child.material.wireframe = isWireframe;
          }
        }
      });
    });
  });
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.TextureLoader().load('./assets/images/flowerbackground.jpg');

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, -1, 8);
  camera.lookAt(0, -0.4, 0);

  const canvas = document.getElementById("plantCanvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5));
  const dir = new THREE.DirectionalLight(0xffffff, 8);
  dir.position.set(5,10,5);
  dir.castShadow = true;
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  preloadModels();
}

function onWindowResize() {
  const canvas = document.getElementById('plantCanvas');
  const w = canvas.clientWidth, h = canvas.clientHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function preloadModels() {
  const loader = new THREE.GLTFLoader();

  // — Grow model (local)
  loader.load(
    './assets/models/grow_plant.glb',
    gltf => {
      growModel = gltf.scene;
      growModel.position.set(0, -3.8, 0);
      growModel.scale.set(1.3,1.3,1.3);
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
        let action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        growActions[clip.name] = clip;
      });
    },
    xhr => console.log(`Grow model: ${(xhr.loaded/xhr.total*100).toFixed(1)}% loaded`),
    err => console.error('Error loading grow model:', err)
  );

  // — Bloom model (external)
  loader.load(
    'https://drive.google.com/file/d/1HaBEQflGHUE0geqToDGqHN4eSXCM4vZE/view?usp=drive_link',
    gltf => {
      bloomModel = gltf.scene;
      bloomModel.position.set(0, -3.8, 0);
      bloomModel.scale.set(1.3,1.3,1.3);
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
        let action = bloomMixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        bloomActions[clip.name] = action;
      });
    },
    xhr => console.log(`Bloom model: ${(xhr.loaded/xhr.total*100).toFixed(1)}% loaded`),
    err => console.error('Error loading bloom model:', err)
  );
}

function playGrow() {
  if (!growModel || !Object.keys(growActions).length) return;
  growModel.visible = true;
  if (bloomModel) bloomModel.visible = false;
  mixer = new THREE.AnimationMixer(growModel);
  Object.values(growActions).forEach(clip => {
    let action = mixer.clipAction(clip);
    action.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
    action.play();
  });
  const s = document.getElementById('growSound');
  if (s) { s.currentTime = 0; s.play(); }
}

function playBloom() {
  if (!bloomModel || !Object.keys(bloomActions).length) return;
  bloomModel.visible = true;
  if (growModel) growModel.visible = false;
  mixer = bloomMixer;
  Object.values(bloomActions).forEach(action => {
    action.reset().play();
  });
  const s = document.getElementById('bloomSound');
  if (s) { s.currentTime = 0; s.play(); }
}

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.016);
  renderer.render(scene, camera);
}
