let isRecording = false;
let recognition = new webkitSpeechRecognition(); // initialize recognition variable outside toggleRecording function
let isAudioPlaying = false;
let audioContext;

const recordButton = document.getElementById('recordButton');
const buttons = document.querySelectorAll('button');

// Start and Stop Voice Recording
function toggleRecording() {
  if (!isRecording) {
    fetchRecording()
      .then(audioURL => {
        recognition.start();
        recognition.onend = function (e) {
          if (isRecording && recognition.state !== 'inactive') {
            recognition.start();
          } else {
            stopRecording();
          }
        };
      });

    recordButton.src = 'static/img/stop.svg';
    isRecording = true;

    setTimeout(() => {
      stopRecording();
    }, 15000);
  } else {
    stopRecording();
  }
}


// Fetch /record route to record the voice_recording.wav file
function fetchRecording() {
  return fetch('/record')
    .then(response => response.blob())
    .then(blob => {
      const audioURL = URL.createObjectURL(blob);
      console.log("fetchRecording called")
      return audioURL;
    })
    .catch(error => console.error(error));
}

function stopRecording() {
  if (isRecording) {
    recordButton.src = 'static/img/record.svg';
    recognition.stop(); // call stop method on recognition object
    isRecording = false;

    fetch('/stop', { method: 'POST' })
      .then(response => {
        if (response.ok) {
          console.log('Recording stopped');
        } else {
          console.error('Error stopping recording');
        }
      })
      .catch(error => console.error(error));
  }
}

function playRecording() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioElement = document.createElement('audio');
  const timestamp = new Date().getTime();
  audioElement.src = `/voice_recording.wav?_=${timestamp}`;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 2.0;

  const audioSource = audioContext.createMediaElementSource(audioElement);
  audioSource.connect(gainNode);
  gainNode.connect(audioContext.destination);

  audioElement.play();
  console.log("playRecording called");
}

// Play English Audio recordings
function engAudio(filename) {
  if (isAudioPlaying) {
    return;
  }

  isAudioPlaying = true;

  disableButtons();

  var audio = new Audio('/static/english_audio/' + filename);

  audio.addEventListener('ended', () => {
    isAudioPlaying = false;
    enableButtons();
  });

  audio.play();
  console.log('Playing ' + filename);
}

function disableButtons() {
  buttons.forEach((button) => {
    button.disabled = true;
  });
}

function enableButtons() {
  buttons.forEach((button) => {
    button.disabled = false;
  });
}

// Delete user recording on page refresh
$(document).ready(function() {
  $(window).bind('beforeunload', function() {
    $.ajax({
      url: '/delete_files',
      type: 'POST',
      success: function(response) {
        console.log('Files deleted');
      },
      error: function(error) {
        console.error('Error deleting files');
      }
    });
  });
});
