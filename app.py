from flask import Flask, render_template, send_file

import atexit, os
import pyaudio
import wave
import subprocess

app = Flask(__name__)

@app.route("/")
def home(): 
    return render_template("index.html")
    

# Record audio
@app.route("/record", methods=['GET'])
def record_voice():
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    RECORD_SECONDS = 15

    p = pyaudio.PyAudio()

    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    print("Recording started. Speak into the microphone...")

    frames = []

    global recording
    recording = True

    for _ in range(int(RATE / CHUNK * RECORD_SECONDS)):
        if not recording:
            break
        data = stream.read(CHUNK)
        frames.append(data)

    print("Recording finished.")

    wav_filename = 'voice_recording.wav'

    stream.stop_stream()
    stream.close()
    p.terminate()

    wavefile = wave.open(wav_filename, 'wb')
    wavefile.setnchannels(CHANNELS)
    wavefile.setsampwidth(p.get_sample_size(FORMAT))
    wavefile.setframerate(RATE)
    wavefile.writeframes(b''.join(frames))
    wavefile.close()

    convert_to_wav(wav_filename, 'voice_recording.ogg')
    print("OGG recorded done")
    # os.remove('voice_recording.ogg')  # delete the .ogg file

    return send_file('voice_recording.ogg', mimetype="audio/ogg")

def convert_to_wav(input_file, output_file):
    print("OGG recorded converted to WAV")
    command = f'ffmpeg -i {input_file} -c:a libvorbis -q:a 4 -y {output_file}'
    subprocess.call(command, shell=True)

@app.route("/voice_recording.wav")
def audioFile():
    print("WAV played!")
    return send_file("voice_recording.wav", mimetype="audio/wav")


# Function to stop the recording
@app.route("/stop", methods=['POST'])
def stop_recording():
    global recording
    recording = False
    print("STOPPED!")
    return "Recording stopped"


# Function to delete the files when the app is closed
@app.route("/delete_files", methods=['POST'])
def delete_files():
    try:
        os.remove('voice_recording.ogg')
        os.remove('voice_recording.wav')
        return "Files deleted"
    except Exception as e:
        return "Error deleting files: " + str(e)

# Register the delete_files function to be called on exit
atexit.register(delete_files)


if __name__ == '__main__':
    app.run()
