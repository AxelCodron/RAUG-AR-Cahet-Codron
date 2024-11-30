import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { addListenerToCamera, addSoundToObject, playObjectSound } from './sounds';
import { add } from 'three/webgpu';

// ------------------------------- Setup -------------------------------

let container;
let camera, scene, renderer;
let controller;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let loadedBlueBottle, loadedGreenBottle, loadedOrangeBottle = false;
let raycaster = new THREE.Raycaster();
let displayedRules = false;

const loader = new GLTFLoader().setPath('/RAUG-AR-Cahet-Codron/assets/models/');

container = document.createElement('div');
document.body.appendChild(container);

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
light.position.set(0.5, 1, 0.25);
scene.add(light);

// Renderer setup with WebXR and AR support
renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

// Create AR button with hit-test feature
document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

// AR Controller setup
controller = renderer.xr.getController(0);
controller.addEventListener('select', onSelect);
scene.add(controller);

// Interactive group setup
const interactiveBottlesGroup = new InteractiveGroup(renderer, camera);
interactiveBottlesGroup.listenToXRControllerEvents(controller);
scene.add(interactiveBottlesGroup);

// Reticle setup for AR placement
reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
  new THREE.MeshBasicMaterial()
);

reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

// Window resize handling
window.addEventListener('resize', onWindowResize);

// Sounds setup
addListenerToCamera(camera);

// ------------------------------------- GUI -------------------------------------

const dialogs = {
  'intro': {
    content: `Hello scientist!</br>You must find the right combination of bottles</br>to create the remedy against the Covid 31!.</br>Begin by moving a bit to scan your surroundings.</br>When a circle appears, click on the screen to</br>place a bottle on the circle's location.`,
  },
  'blue-bottle': {
    content: `The blue bottle is the first ingredient of</br>the remedy.</br>It's known for its calming properties.</br>Place the second bottle now!`
  },
  'green-bottle': {
    content: `The green bottle is the second ingredient of</br>the remedy.</br>It's known for its healing properties.</br>Place the last bottle now!`
  },
  'orange-bottle': {
    content: `The orange bottle is the last ingredient of</br>the remedy.</br>It's known for its KOOL properties.`
  },
  'game-description': {
    content: `You have now to create the remedy!</br>Look at the bottles and remember the sequence.</br>Then, click on the bottles in the same order to</br>create the remedy!</br>Reach a sequence of 7 to win.</br>Good luck!`
  },
  'lose': {
    content: `Game Over!</br>You have failed to create the remedy against</br>the Covid 31!</br>Humanity is doomed and the world is lost :)`
  },
  'win': {
    content: `Congratulations!</br>You have created the remedy against the</br>Covid 31!`
  },
}

// Créer un conteneur HTML pour l'information
const infoContainer = document.getElementById('info-container');
infoContainer.innerHTML = dialogs['intro'].content;

const mesh = new HTMLMesh(infoContainer);
mesh.position.z = - 0.8;

interactiveBottlesGroup.add(mesh);

// ------------------------------- Simon Game Setup -------------------------------

let gamePattern = [];
let userClickedPattern = [];
let objectsTypes = ["blue-bottle", "green-bottle", "orange-bottle"];
let showingSequence = false;
let gameStarted = false;
let gameRestarted = false;
let winRound = 7;

// ------------------------------- Controls Functions -------------------------------

/**
 * Handles the window resize event
 * @returns {void}
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function getIntersections(controller) {
  const tempMatrix = new THREE.Matrix4();

  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersections = raycaster.intersectObjects(interactiveBottlesGroup.children, true);

  return intersections;
}

/**
 * Sets up the model to be placed in the scene
 * @param {any} model The glb model to setup
 * @param {number} baseScale The original scale of the model
 * @param {string} modelType The name of the model
 * @returns {void}
 */
function setupModel(model, baseScale, modelType) {
  // Position and add the model
  reticle.matrix.decompose(model.position, model.quaternion, model.scale);
  model.scale.set(baseScale, baseScale, baseScale);
  model.userData.type = modelType;

  const modelToAdd = model.scene || model;
  modelToAdd.scale.set(baseScale, baseScale, baseScale);
  modelToAdd.userData.type = modelType;

  interactiveBottlesGroup.add(modelToAdd);

  switch (modelType) {
    case 'blue-bottle':
      loadedBlueBottle = true;
      break;
    case 'green-bottle':
      loadedGreenBottle = true;
      break;
    case 'orange-bottle':
      loadedOrangeBottle = true;
      break;
  }
}

/**
 * Main function to handle the click of a user on the AR scene
 * @param {Event} event The click event
 * @returns {void}
 */
function onSelect(event) {
  if (reticle.visible) {
    // Load a model at the reticle position
    let currentModel;
    let baseScale;
    let modelType;

    if (!loadedBlueBottle) {
      loader.load('blue-bottle.glb', (gltf) => {
        currentModel = gltf.scene;
        baseScale = 0.1;
        modelType = 'blue-bottle';
        setupModel(currentModel, baseScale, modelType);
        infoContainer.innerHTML = dialogs['blue-bottle'].content;
        addSoundToObject(currentModel, 'blue-bottle');
        playObjectSound('blue-bottle');
      });
    } else if (!loadedGreenBottle) {
      loader.load('green-bottle.glb', (gltf) => {
        currentModel = gltf.scene;
        baseScale = 40;
        modelType = 'green-bottle';
        setupModel(currentModel, baseScale, modelType);
        infoContainer.innerHTML = dialogs['green-bottle'].content;
        addSoundToObject(currentModel, 'green-bottle');
        playObjectSound('green-bottle');
      });
    } else if (!loadedOrangeBottle) {
      loader.load('orange-bottle.glb', (gltf) => {
        currentModel = gltf.scene;
        baseScale = 0.04;
        modelType = 'orange-bottle';
        setupModel(currentModel, baseScale, modelType);
        infoContainer.innerHTML = dialogs['orange-bottle'].content;
        addSoundToObject(currentModel, 'orange-bottle');
        playObjectSound('orange-bottle');
      });
    }
  }

  if (displayedRules && gameStarted && !gameRestarted) {
    const controller = event.target;
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      const object = intersection.object.parent.parent.parent.parent;
      const objectScale = object.scale.x;

      // Check the object type and apply the wiggle effect
      // Also check the simon game pattern
      if (object.userData.type === 'blue-bottle') {
        applyWiggleEffect(object, objectScale);
        if (!showingSequence) {
          playObjectSound('blue-bottle');
          userClickedPattern.push('blue-bottle');
          checkAnswer(userClickedPattern.length - 1);
        }
      } else
        if (object.parent.userData.type === 'green-bottle') {
          applyWiggleEffect(object, objectScale, 1000, 100, 0.1);
          if (!showingSequence) {
            playObjectSound('green-bottle');
            userClickedPattern.push('green-bottle');
            checkAnswer(userClickedPattern.length - 1);
          }
        } else
          if (object.parent.userData.type === 'orange-bottle') {
            applyWiggleEffect(object, objectScale, 1000, 100, 0.15);
            if (!showingSequence) {
              playObjectSound('orange-bottle');
              userClickedPattern.push('orange-bottle');
              checkAnswer(userClickedPattern.length - 1);
            }
          }
    }
  }

  if (displayedRules && !gameStarted) {
    infoContainer.style.display = 'none';
    startOver();
    gameStarted = true;
  }

  if (gameRestarted) {
    gameRestarted = false;
    gameStarted = false;
  }

  if (loadedOrangeBottle && !displayedRules) {
    infoContainer.innerHTML = dialogs['game-description'].content;
    displayedRules = true;
  }

  controller.userData.targetRayMode = event.data.targetRayMode;
}

/**
 * Function to apply a wiggle effect to a model
 * @param {any} model The model to apply the wiggle effect
 * @param {number} baseScale The base scale of the model
 * @param {number} duration The duration of the wiggle effect
 * @param {number} wiggleFrequency The frequency of the wiggle effect
 * @param {number} wiggleAmplitude The amplitude of the wiggle effect
 * @returns {void}
 */
function applyWiggleEffect(model, baseScale, duration = 1000, wiggleFrequency = 100, wiggleAmplitude = 0.02) {
  const startTime = performance.now();
  let lastFrameTime = startTime;

  function wiggle() {
    const currentTime = performance.now();
    const elapsedTime = currentTime - startTime;

    if (elapsedTime < duration) {
      if (currentTime - lastFrameTime >= wiggleFrequency) {
        lastFrameTime = currentTime;
        const scaleFactor = baseScale +
          wiggleAmplitude * Math.sin((elapsedTime / 1000) * wiggleFrequency * 2 * Math.PI);
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      }

      requestAnimationFrame(wiggle);
    } else {
      model.scale.set(baseScale, baseScale, baseScale);
    }
  }

  wiggle();
}

// ------------------------------- Simon Game Functions -------------------------------

function nextSequence() {
  let randomChosenObject = objectsTypes[Math.floor(Math.random() * 3)];
  gamePattern.push(randomChosenObject);
  console.log(gamePattern);
  showSequence();
}

function checkAnswer(currentLevel) {
  if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
    if (userClickedPattern.length === gamePattern.length) {
      console.log("success");
      userClickedPattern = [];
      playObjectSound('good-sequence');
      if (gamePattern.length === winRound) {
        console.log("You win");
        playObjectSound('win');
        gameRestarted = true;
        infoContainer.style.display = 'block';
        infoContainer.innerHTML = dialogs['win'].content;
      } else {
        setTimeout(function () {
          nextSequence();
        }, 3000);
      }
    }
  } else {
    setTimeout(function () {
      // GAME OVER
      console.log("wrong");
      playObjectSound('game-over');
      gameRestarted = true;
      infoContainer.style.display = 'block';
      infoContainer.innerHTML = dialogs['lose'].content;
    }, 200);
  }
}

function showSequence() {
  showingSequence = true;
  setTimeout(function () {
    showingSequence = false;
  }, 1000 * gamePattern.length);
  for (let i = 0; i < gamePattern.length; i++) {
    setTimeout(function () {
      let object = interactiveBottlesGroup.children.find((child) => child.userData.type === gamePattern[i]).children[0];
      let objectScale = object.scale.x;

      if (gamePattern[i] === "blue-bottle") {
        object = object.parent;
        objectScale = object.scale.x;
        applyWiggleEffect(object, objectScale);
        playObjectSound('blue-bottle');
      } else if (gamePattern[i] === "green-bottle") {
        applyWiggleEffect(object, objectScale, 1000, 100, 0.1);
        playObjectSound('green-bottle');
      } else if (gamePattern[i] === "orange-bottle") {
        applyWiggleEffect(object, objectScale, 1000, 100, 0.15);
        playObjectSound('orange-bottle');
      }
    }, 1000 * i);
  }
}

function startOver() {
  gamePattern = [];
  userClickedPattern = [];
  nextSequence();
}

// ------------------------------- Main Loop -------------------------------

/**
 * Main function to animate the AR scene
 * @param {any} timestamp 
 * @param {any} frame 
 */
function animate(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then(function (referenceSpace) {
        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
          hitTestSource = source;
        });
      });

      session.addEventListener('end', function () {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {
        const hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}