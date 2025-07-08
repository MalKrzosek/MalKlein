
let scene, camera, renderer, controls, mixer;
let openModel, crushModel;
let openActions = {}, crushActions = {};
let crushMixer;

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

    [openModel, crushModel].forEach((model) => {
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
  const backgroundTexture = textureLoader.load('./assets/images/coke_background3.jpg');
  scene.background = backgroundTexture;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(-3, 8, 13);

  
  const canvas = document.getElementById("cokeCanvas");
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);

requestAnimationFrame(() => {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});
  

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffa07a, 1.5); // soft salmon
fillLight.position.set(-5, 3, 5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe4b5, 1.2); // light golden
rimLight.position.set(3, 4, -5);
scene.add(rimLight);

const bottomLight = new THREE.PointLight(0xffc0cb, 3, 30); // soft pink glow
bottomLight.position.set(0, -5, 0);
scene.add(bottomLight);

const softAmbient = new THREE.AmbientLight(0xffccaa, 0.5);
scene.add(softAmbient);



  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;


  controls = new THREE.OrbitControls(camera, renderer.domElement);

  preloadModels();
  

  window.addEventListener('resize', onWindowResize);
  onWindowResize(); 
  
  function onWindowResize() {
    const canvas = document.getElementById('cokeCanvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
}

function preloadModels() {
  const loader = new THREE.GLTFLoader();
  

 
  loader.load('./assets/models/coke_open.glb', function (gltf) {
    openModel = gltf.scene;
    openModel.position.set(0, -7, 0);
    openModel.scale.set(.8, .8, .8);
    openModel.visible = true;
    scene.add(openModel);


   openModel.traverse((child) => {
      if (child.isMesh) {
        child.material.metalness = 0.6;
        child.material.roughness = 0.2;
        child.material.envMapIntensity = 0;
        child.material.needsUpdate = true;
      }
    });
   

    mixer = new THREE.AnimationMixer(openModel);
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      openActions[clip.name] = clip;
    });
  });


  loader.load('./assets/models/coke_crush.glb', function (gltf) {
    crushModel = gltf.scene;
    crushModel.position.set(0, -7, 0);
    crushModel.scale.set(.8, .8, .8);
    crushModel.visible = false;
    scene.add(crushModel);


    crushModel.traverse((child) => {
      if (child.isMesh) {
        child.material.metalness = 0.6;
        child.material.roughness = 0.2;
        child.material.envMapIntensity = 0;
        child.material.needsUpdate = true;
      }
    });
   


    crushMixer = new THREE.AnimationMixer(crushModel);
    crushActions = {};
    gltf.animations.forEach((clip) => {
      const action = crushMixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      crushActions[clip.name] = action;
    });
  });
}

function playOpen() {
  if (!openModel || !Object.keys(openActions).length) return;

  openModel.visible = true;
  if (crushModel) crushModel.visible = false;

  mixer = new THREE.AnimationMixer(openModel);
  for (const clipName in openActions) {
    const clip = openActions[clipName];
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.reset().play();
  }
  const openSound = document.getElementById('openSound');
  if (openSound) {
    openSound.currentTime = 0;
    openSound.play();
  }

}

function playCrush() {
  if (!crushModel || !Object.keys(crushActions).length) return;

  crushModel.visible = true;
  if (openModel) openModel.visible = false;

  mixer = crushMixer;
  for (const action of Object.values(crushActions)) {
    action.reset().play();
  }

  const crushSound = document.getElementById('crushSound');
  if (crushSound) {
    crushSound.currentTime = 0;
    crushSound.play();
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

  [openModel, crushModel].forEach((model) => {
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