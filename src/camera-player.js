import * as BABYLON from "babylonjs";
import { WeaponFire } from "./weapon-fire";
import * as sampleMap from "./sample-map";
import { SoundEngine } from "./sound";
import { enemy1 } from "./render";
import { allEnemis, enemyObjects, decreaseEnemies } from "./enemy";
var camera;
var scores = [];

class CameraPlayer {
  constructor() {
    this.x = 0;
    this.z = 0;
    // this.hp = 100;
    // this.hpText = "100";
    this.score = 0;
  }

  setup(scene) {
    // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
    camera = new BABYLON.FreeCamera(
      "camera1",
      new BABYLON.Vector3(5, 1, 0),
      scene
    );
    camera.minZ = 0.01;
    // Target the camera to scene origin
    camera.setTarget(new BABYLON.Vector3(1, 1, 0));
    // Attach the camera to the canvas
    camera.attachControl(canvas, true);
    camera.inertia = 0;
    // Let's remove default keyboard:
    camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    camera.inputs.remove(camera.inputs.attached.mouse);
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    camera.checkCollisions = true;
    camera.applyGravity = true;
    var cameraPlayer = this;

    // Create our own manager:
    var FreeCameraKeyboardRotateInput = function() {
      this._keys = [];
      this.keysLeft = [68, 39];
      this.keysRight = [65, 37];
      this.keysForward = [87, 38];
      this.keysBack = [83, 40];
      this.sensibility = 0.03;
      this.moveSpeed = 0.1;
    };

    // Hooking keyboard events
    FreeCameraKeyboardRotateInput.prototype.attachControl = function(
      element,
      noPreventDefault
    ) {
      var _this = this;
      if (!this._onKeyDown) {
        element.tabIndex = 1;
        this._onKeyDown = function(evt) {
          if (
            _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
            _this.keysRight.indexOf(evt.keyCode) !== -1 ||
            _this.keysForward.indexOf(evt.keyCode) !== -1 ||
            _this.keysBack.indexOf(evt.keyCode) !== -1
          ) {
            var index = _this._keys.indexOf(evt.keyCode);
            if (index === -1) {
              _this._keys.push(evt.keyCode);
            }
            if (!noPreventDefault) {
              evt.preventDefault();
            }
          }
          if (WeaponFire.checkFire(evt, scene) == true) {
            for (let enemy of enemyObjects) {
              console.log("camera-player.js: enemy", enemy);

              var tempScore = enemy.theMesh.shot ? enemy.tryToDie() : -1;
              console.log("camera-player.js: tempScore", tempScore);

              if (tempScore != -1) {
                cameraPlayer.score = tempScore;
                enemy.theMesh.shot = false;
                enemy.theMesh.dispose();
                decreaseEnemies();
                scores.push(cameraPlayer.score);
                console.log("camera-player.js: scores", scores);
              }
            }
            // if()
            console.log("Score: " + String(cameraPlayer.score));
            let scoreElem = document.querySelector("[data-score-text]");
            scoreElem.innerText = `Last Exam Score: \n ${Math.floor(
              cameraPlayer.score
            )}`;
          }
        };
        this._onKeyUp = function(evt) {
          if (
            _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
            _this.keysRight.indexOf(evt.keyCode) !== -1 ||
            _this.keysForward.indexOf(evt.keyCode) !== -1 ||
            _this.keysBack.indexOf(evt.keyCode) !== -1
          ) {
            var index = _this._keys.indexOf(evt.keyCode);
            if (index >= 0) {
              _this._keys.splice(index, 1);
            }
            if (!noPreventDefault) {
              evt.preventDefault();
            }
          }
        };

        element.addEventListener("keydown", this._onKeyDown, false);
        element.addEventListener("keyup", this._onKeyUp, false);
        BABYLON.Tools.RegisterTopRootEvents([
          { name: "blur", handler: this._onLostFocus }
        ]);
      }
    };

    // Unhook
    FreeCameraKeyboardRotateInput.prototype.detachControl = function(element) {
      if (this._onKeyDown) {
        element.removeEventListener("keydown", this._onKeyDown);
        element.removeEventListener("keyup", this._onKeyUp);
        BABYLON.Tools.UnregisterTopRootEvents([
          { name: "blur", handler: this._onLostFocus }
        ]);
        this._keys = [];
        this._onKeyDown = null;
        this._onKeyUp = null;
      }
    };

    // This function is called by the system on every frame
    FreeCameraKeyboardRotateInput.prototype.checkInputs = function() {
      if (this._onKeyDown) {
        var camera = this.camera;

        // Pre-update camera positions
        camera.position.x = cameraPlayer.x;
        camera.position.y = 1;
        camera.position.z = cameraPlayer.z;

        // Keyboard
        for (var index = 0; index < this._keys.length; index++) {
          var keyCode = this._keys[index];
          if (this.keysLeft.indexOf(keyCode) !== -1) {
            camera.cameraRotation.y += this.sensibility;
          } else if (this.keysRight.indexOf(keyCode) !== -1) {
            camera.cameraRotation.y -= this.sensibility;
          } else if (this.keysForward.indexOf(keyCode) !== -1) {
            camera.position.addInPlace(
              camera.getDirection(BABYLON.Axis.Z).scale(this.moveSpeed)
            );
            SoundEngine.playUnique("/res/footsteps.ogg");
          } else if (this.keysBack.indexOf(keyCode) !== -1) {
            camera.position.addInPlace(
              camera.getDirection(BABYLON.Axis.Z).scale(-this.moveSpeed)
            );
            SoundEngine.playUnique("/res/footsteps.ogg");
          }

          // Collision detection and position update
          let map = sampleMap.map;
          if (map.isValidPosition(camera.position.x, camera.position.z)) {
            cameraPlayer.x = camera.position.x;
            cameraPlayer.z = camera.position.z;
          } else {
            camera.position.x = cameraPlayer.x;
            camera.position.z = cameraPlayer.z;
          }
        }
      }
    };
    FreeCameraKeyboardRotateInput.prototype.getTypeName = function() {
      return "FreeCameraKeyboardRotateInput";
    };
    FreeCameraKeyboardRotateInput.prototype._onLostFocus = function(e) {
      this._keys = [];
    };
    FreeCameraKeyboardRotateInput.prototype.getSimpleName = function() {
      return "keyboardRotate";
    };

    // Connect to camera:
    camera.inputs.add(new FreeCameraKeyboardRotateInput());
  }
}

var player = new CameraPlayer();

export { player, camera, scores };
