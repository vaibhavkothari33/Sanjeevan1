// HTML CSS JavaScriptResult Skip Results Iframe
// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// import { FilesetResolver } from "@mediapipe/tasks-vision";
import { FilesetResolver, GestureRecognizer, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Your JavaScript code using imported modules goes here

let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: runningMode
  });
  demosSection.classList.remove("invisible");
};
createGestureRecognizer();

/********************************************************************
// Demo 1: Detect hand gestures in images
********************************************************************/

const imageContainers = document.getElementsByClassName("detectOnClick");

for (let i = 0; i < imageContainers.length; i++) {
  imageContainers[i].children[0].addEventListener("click", handleClick);
}

async function handleClick(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await gestureRecognizer.setOptions({ runningMode: "IMAGE" });
  }

  const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  for (let i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i];
    n.parentNode.removeChild(n);
  }

  const results = gestureRecognizer.recognize(event.target);

  console.log(results);
  if (results.gestures.length > 0) {
    const p = event.target.parentNode.childNodes[3];
    p.setAttribute("class", "info");

    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat(
      results.gestures[0][0].score * 100
    ).toFixed(2);
    const handedness = results.handednesses[0][0].displayName;

    p.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore}%\n Handedness: ${handedness}`;
    p.style =
      "left: 0px;" +
      "top: " +
      event.target.height +
      "px; " +
      "width: " +
      (event.target.width - 10) +
      "px;";

    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";

    event.target.parentNode.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1
      });
    }
  }
}

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  const constraints = {
    video: true
  };

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }

  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2
      });
    }
  }
  canvasCtx.restore();

  // Function to handle gesture recognition
async function recognizeGesture() {
    if (results.gestures.length > 0) {
      gestureOutput.style.display = "block";
      gestureOutput.style.width = videoWidth;
      const categoryName = results.gestures[0][0].categoryName;
      const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
      const handedness = results.handednesses[0][0].displayName;
      gestureOutput.innerText = `GestureRecognizer: ${categoryName}`;
  
      // Speak the categoryName
      speakText(categoryName);
  
      // Wait for 2 seconds before detecting again
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      gestureOutput.style.display = "none";
    }
  
    // Detect again
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  }
  
  // Function to speak the text
  function speakText(text) {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    } else {
      // Inform the user that the browser doesn't support TTS
      alert('Your browser does not support Text-to-Speech');
    }
  }
  
  // Call recognizeGesture function initially
  recognizeGesture();
}  
//   if (results.gestures.length > 0) {
//     gestureOutput.style.display = "block";
//     gestureOutput.style.width = videoWidth;
//     const categoryName = results.gestures[0][0].categoryName;
//     const categoryScore = parseFloat(
//       results.gestures[0][0].score * 100
//     ).toFixed(2);
//     const handedness = results.handednesses[0][0].displayName;
//     gestureOutput.innerText = `GestureRecognizer: ${categoryName}`;
//     // gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
//   } else {
//     gestureOutput.style.display = "none";
//   }

// if (results.gestures.length > 0) {
//     gestureOutput.style.display = "block";
//     gestureOutput.style.width = videoWidth;
//     const categoryName = results.gestures[0][0].categoryName;
//     const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
//     const handedness = results.handednesses[0][0].displayName;
//     gestureOutput.innerText = `GestureRecognizer: ${categoryName}`;
  
//     // Speak the categoryName
//     speakText(categoryName);
//   } else {
//     gestureOutput.style.display = "none";
//   }
  
//   // Function to speak the text
//   function speakText(text) {
//     if ('speechSynthesis' in window) {
//       const synth = window.speechSynthesis;
//       const utterance = new SpeechSynthesisUtterance(text);
//       synth.speak(utterance);
//     } else {
//       // Inform the user that the browser doesn't support TTS
//       alert('Your browser does not support Text-to-Speech');
//     }
//   }
  
//   if (webcamRunning === true) {
//     window.requestAnimationFrame(predictWebcam);
//   }
// }


// // Assuming categoryName is obtained from your API
// let CategoryName = results.gestures[0][0].categoryName; // Replace this with the categoryName received from your API

// // Check if browser supports SpeechSynthesis
// if ('speechSynthesis' in window) {
//   const synth = window.speechSynthesis;

//   // Function to speak the categoryName
//   const speakCategoryName = () => {
//     const utterance = new SpeechSynthesisUtterance(CategoryName);
//     synth.speak(utterance);
//   };

//   // Call the speakCategoryName function wherever appropriate in your code
//   speakCategoryName();
// } else {
//   // Inform the user that the browser doesn't support TTS
//   alert('Your browser does not support Text-to-Speech');
// }

// if (results.gestures.length > 0) {
//     gestureOutput.style.display = "block";
//     gestureOutput.style.width = videoWidth;
//     const categoryName = results.gestures[0][0].categoryName;
//     gestureOutput.innerText = `GestureRecognizer: ${categoryName}`;
  
//     // Speak the categoryName
//     speakCategoryName(categoryName);
    
//     // Optional: Speak additional information
//     // const speechText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
//     // speakText(speechText);
//   } else {
//     gestureOutput.style.display = "none";
//   }
  
//   // Function to speak the categoryName
//   function speakCategoryName(categoryName) {
//     if ('speechSynthesis' in window) {
//       const synth = window.speechSynthesis;
//       const utterance = new SpeechSynthesisUtterance(categoryName);
//       synth.speak(utterance);
//     } else {
//       // Inform the user that the browser doesn't support TTS
//       alert('Your browser does not support Text-to-Speech');
//     }
//   }
  