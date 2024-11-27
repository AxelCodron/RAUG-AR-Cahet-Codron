// BUTTONS TO PRESS
// Raycaster for interaction
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerDown(event) {
  // Convert touch/mouse coordinates to normalized device coordinates (-1 to 1)
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Cast a ray from the camera
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(buttons);

  if (intersects.length > 0) {
    const clickedButton = intersects[0].object;

    if (clickedButton.material.color.getHex() === 0xff0000) {
      console.log('Red button pressed!');
      console.log(clickedButton.material.color.getHex());
      clickedButton.material.color.set(0xffffff);
      console.log(clickedButton.material.color.getHex())
    } else if (clickedButton.material.color.getHex() === 0x00ff00) {
      console.log('Green button pressed!');
      clickedButton.material.color.set(0x000000);
    } else if (clickedButton.material.color.getHex() === 0x0000ff) {
      console.log('Blue button pressed!');
      clickedButton.material.color.set(0xffff00);
    }
  }
}

// Add buttons to the scene
buttonPositions.forEach((pos, index) => {
  const button = new THREE.Mesh(buttonGeometry, buttonMaterials[index]);
  // Set the position relative to the camera's initial position
  button.position.set(pos.x, pos.y, -2);
  camera.add(button);
  buttons.push(button);
});

scene.add(camera);

function onPointerDown(event) {
    // Convert touch/mouse coordinates to normalized device coordinates (-1 to 1)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(buttons);

    if (intersects.length > 0) {
      const clickedButton = intersects[0].object;

      if (clickedButton.material.color.getHex() === 0xff0000) {
        console.log('Red button pressed!');
      } else if (clickedButton.material.color.getHex() === 0x00ff00) {
        console.log('Green button pressed!');
      } else if (clickedButton.material.color.getHex() === 0x0000ff) {
        console.log('Blue button pressed!');
      }
    }
  }

  // Add event listener for user input
  window.addEventListener('pointerdown', onPointerDown);