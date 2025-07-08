
let scene, camera, renderer, controls, mixer;
let sitModel, downModel;
let sitActions = {}, downActions = {};
let downMixer;

window.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
  setupWireframeToggle();
});

function setupWireframeToggle() {
  let isWireframe = false;

  const button = document.getElementById("toggleWireframe");
  if (!button) {
    console.error("Wireframe button not found!");
    return;
  }

  button.addEventListener("click", () => {
    isWireframe = !isWireframe;

    [sitModel, downModel].forEach((model) => {
      if (!model) return;

      model.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.wireframe = isWireframe);
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

  const textureLoader = new THREE.TextureLoader();
  const backgroundTexture = textureLoader.load('./assets/images/dogbackground.jpg', (texture) => {
    texture.encoding = THREE.sRGBEncoding;
  });
  scene.background = backgroundTexture;
  

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(7, 1, 3);
  camera.lookAt(0, 0, 0); 

  const canvas = document.getElementById("dogCanvas");
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setPixelRatio(window.devicePixelRatio);


  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1); 
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4); 
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1); 
scene.add(ambientLight);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4; 

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  preloadModels();

  window.addEventListener('resize', onWindowResize);
  onWindowResize();
  function onWindowResize() {
    const canvas = document.getElementById('dogCanvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}

function preloadModels() {
  const loader = new THREE.GLTFLoader();


  loader.load('./assets/models/dog_sitting.glb', function (gltf) {
    sitModel = gltf.scene;
    sitModel.position.set(-2, -1.4, -2);
    sitModel.scale.set(1.2, 1.2, 1.2);
    sitModel.visible = true;
   
    sitModel.traverse((child) => {
      if (child.isMesh) {
        child.material.metalness = 0.2;
        child.material.roughness = 0.05;
        child.material.envMapIntensity = 1.5;
        child.material.needsUpdate = true;
      }
    });
   
    scene.add(sitModel);

    mixer = new THREE.AnimationMixer(sitModel);
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      sitActions[clip.name] = clip;
    });
  });

 
  loader.load('./assets/models/dog_laying.glb', function (gltf) {
    downModel = gltf.scene;
    downModel.position.set(-2, -1.4, -2);
    downModel.scale.set(1.2, 1.2, 1.2);
    downModel.visible = false;
   
   
    downModel.traverse((child) => {
      if (child.isMesh) {
        child.material.metalness = 0.2;
        child.material.roughness = 0.05;
        child.material.envMapIntensity = 1.5;
        child.material.needsUpdate = true;
      }
    });
   
   
    scene.add(downModel);

    downMixer = new THREE.AnimationMixer(downModel);
    downActions = {};
    gltf.animations.forEach((clip) => {
      const action = downMixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      downActions[clip.name] = action;
    });
  });
}

function playSit() {
  if (!sitModel || !Object.keys(sitActions).length) return;

  sitModel.visible = true;
  if (downModel) downModel.visible = false;

  mixer = new THREE.AnimationMixer(sitModel);
  for (const clipName in sitActions) {
    const clip = sitActions[clipName];
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.reset().play();
  }

  const sitSound = document.getElementById('sitSound');
  if (sitSound) {
    sitSound.currentTime = 0;
    sitSound.play();
  }

}

function playDown() {
  if (!downModel || !Object.keys(downActions).length) return;

  downModel.visible = true;
  if (sitModel) sitModel.visible = false;

  mixer = downMixer;
  for (const action of Object.values(downActions)) {
    action.reset().play();
  }

  const downSound = document.getElementById('downSound');
  if (downSound) {
    downSound.currentTime = 0;
    downSound.play();
  }

}

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.016);
  renderer.render(scene, camera);
}
let isWireframe = false;

document.getElementById("toggleWireframe").addEventListener("click", () => {
  isWireframe = !isWireframe;

  [sitModel, downModel].forEach((model) => {
    if (!model) return;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.wireframe = isWireframe);
        } else {
          child.material.wireframe = isWireframe;
        }
      }
    });
  });
});
