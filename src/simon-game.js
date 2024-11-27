let gamePattern = [];
let userClickedPattern = [];
let objectsTypes = ["flask", "tube", "glass-bottle"];
let showingSequence = false;

function nextSequence() {
    let randomChosenObject = objectsTypes[Math.floor(Math.random() * 3)];
    gamePattern.push(randomChosenObject);
    showSequence();
}

function checkAnswer(currentLevel) {
    if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
        if (userClickedPattern.length === gamePattern.length) {
            console.log("success");
            setTimeout(function () {
                nextSequence();
            }, 1000);
        }
    } else {
        setTimeout(function () {
            // GAME OVER
            console.log("wrong");
        }, 200);
        startOver();
    }
}

function animateObject(objectType) {
    const duration = 3000;
    const wiggleFrequency = 100;
    const baseScale = 0.1;
    const startTime = performance.now();
    const model = scene.children[3 + objectsTypes.indexOf(objectType)];

    let lastFrameTime = startTime;

    function wiggle() {
        const currentTime = performance.now();
        const elapsedTime = currentTime - startTime;

        if (elapsedTime < duration) {
            if (currentTime - lastFrameTime >= wiggleFrequency) {
                lastFrameTime = currentTime;
                const scaleFactor = baseScale + Math.sin((elapsedTime / 1000));
                model.scale.x = scaleFactor;
                model.scale.y = scaleFactor;
                model.scale.z = scaleFactor;
            }
            requestAnimationFrame(wiggle);
        }
    }

    wiggle();
}

function clickObject(objectType) {
    if (showingSequence) {
        return;
    }
    userClickedPattern.push(objectType);
    animateObject();
    checkAnswer(userClickedPattern.length - 1);
}

function showSequence() {
    showingSequence = true;
    for (let i = 0; i < gamePattern.length; i++) {
        setTimeout(function () {
            animateObject(gamePattern[i]);
        }, 1000 * i);
    }
    showingSequence = false;
}

function startOver() {
    gamePattern = [];
    userClickedPattern = [];
    nextSequence();
}
