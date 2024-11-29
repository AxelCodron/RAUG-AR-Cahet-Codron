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
