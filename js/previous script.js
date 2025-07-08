
let scene, camera, renderer, controls, mixer;
let growModel;
let growActions = {}, bloomActions = {};
let currentBloomModel;

window.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
});

function init() {
  scene = new THREE.Scene();

  const textureLoader = new THREE.TextureLoader();
  const backgroundTexture = textureLoader.load('./assets/images/flowerbackground.jpg');
  scene.background = backgroundTexture;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, -1, 8);
  camera.lookAt(0, -0.4, 0); 

  const canvas = document.getElementById("plantCanvas");
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.2);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 4);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  preloadGrowModel();

  window.addEventListener('resize', onWindowResize);
  function onWindowResize() {
    const canvas = document.getElementById('plantCanvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}

function preloadGrowModel() {
  const loader = new THREE.GLTFLoader();
  loader.load('./assets/models/grow_plant.glb', function (gltf) {
    const model = gltf.scene;
    model.position.set(0, -3.8, 0);
    model.scale.set(1.2, 1.2, 1.2);
    scene.add(model);
    growModel = model;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.scale.x = child.scale.x || 0.001;
        child.scale.y = child.scale.y || 0.001;
        child.scale.z = child.scale.z || 0.001;
        child.updateMatrixWorld(true);
        child.material.roughness = 0.4;
        child.material.metalness = 0.1;
      }
    });

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        growActions[clip.name] = action;
      });
    }
  }, undefined, function (error) {
    console.error('Error loading grow model:', error);
  });
}
function playGrow() {
  // Remove bloom model if it exists
  if (currentBloomModel) {
    scene.remove(currentBloomModel);
    currentBloomModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    currentBloomModel = null;
  }

  // Re-add grow model if it's not already in the scene
  if (growModel && !scene.children.includes(growModel)) {
    scene.add(growModel);
  }

  // Set up mixer and play grow animation
  if (growModel && Object.keys(growActions).length > 0) {
    mixer = new THREE.AnimationMixer(growModel);
    for (const action of Object.values(growActions)) {
      const newAction = mixer.clipAction(action._clip);
      newAction.setLoop(THREE.LoopOnce);
      newAction.clampWhenFinished = true;
      newAction.reset().play();
    }
  }
}


function playBloom() {
  // Remove grow model if it's visible
  if (growModel && scene.children.includes(growModel)) {
    scene.remove(growModel);
  }

  // Remove previous bloom model if it exists
  if (currentBloomModel) {
    scene.remove(currentBloomModel);
    currentBloomModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    currentBloomModel = null;
  }

  // Load and add bloom model
  const loader = new THREE.GLTFLoader();
  loader.load('./assets/models/bloom_plant.glb', function (gltf) {
    const model = gltf.scene;
    model.position.set(0, -3.3, 0);
    model.scale.set(1.3, 1.3, 1.3);
    scene.add(model);
    currentBloomModel = model;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.roughness = 0.4;
        child.material.metalness = 0.1;
      }
    });

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      bloomActions = {};
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        bloomActions[clip.name] = action;
        action.reset().play();
      });
    }
  }, undefined, function (error) {
    console.error('Error loading bloom model:', error);
  });
}
function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.016);
  renderer.render(scene, camera);
}
