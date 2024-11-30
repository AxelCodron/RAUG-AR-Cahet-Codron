import * as THREE from 'three';

// ------------------- Variables -------------------

// Listener and audio loader
const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();

// ------------------- Sounds -------------------

// Bottles positionnal sound effects
const blueBottleClick = new THREE.PositionalAudio(listener);
audioLoader.load('assets/sounds/blue-bottle-click.mp3', (buffer) => {
    blueBottleClick.setBuffer(buffer);
    blueBottleClick.setRefDistance(20);
    blueBottleClick.setVolume(0.5);
});

const greenBottleClick = new THREE.PositionalAudio(listener);
audioLoader.load('assets/sounds/green-bottle-click.mp3', (buffer) => {
    greenBottleClick.setBuffer(buffer);
    greenBottleClick.setRefDistance(20);
    greenBottleClick.setVolume(0.5);
});

const orangeBottleClick = new THREE.PositionalAudio(listener);
audioLoader.load('assets/sounds/orange-bottle-click.mp3', (buffer) => {
    orangeBottleClick.setBuffer(buffer);
    orangeBottleClick.setRefDistance(20);
    orangeBottleClick.setVolume(0.5);
});

// Game sound effects
const winMusic = new THREE.Audio(listener);
audioLoader.load('assets/sounds/win.mp3', (buffer) => {
    winMusic.setBuffer(buffer);
    winMusic.setVolume(0.5);
});

const gameOverMusic = new THREE.Audio(listener);
audioLoader.load('assets/sounds/game-over.mp3', (buffer) => {
    gameOverMusic.setBuffer(buffer);
    gameOverMusic.setVolume(0.5);
});

const goodSequenceMusic = new THREE.Audio(listener);
audioLoader.load('assets/sounds/good-sequence.mp3', (buffer) => {
    goodSequenceMusic.setBuffer(buffer);
    goodSequenceMusic.setVolume(0.5);
});

const sounds = {
    'blue-bottle': blueBottleClick,
    'green-bottle': greenBottleClick,
    'orange-bottle': orangeBottleClick,
    'win': winMusic,
    'game-over': gameOverMusic,
    'good-sequence': goodSequenceMusic
};

// ------------------- Functions -------------------

function addListenerToCamera(camera) {
    camera.add(listener);
}

function addSoundToObject(object, sound) {
    object.add(sounds[sound]);
}

function playObjectSound(sound) {
    sounds[sound].play();
}

// ------------------- Export -------------------

export {
    addListenerToCamera, addSoundToObject, playObjectSound
};