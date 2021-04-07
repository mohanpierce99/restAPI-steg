# We will use wave package available in native Python installation to read and write .wav audio file
import wave
import sys
from pydub import AudioSegment
# read wave audio file

print(sys.argv)
if sys.argv[1] == "false":
    print("looool",sys.argv[4])
    sound = AudioSegment.from_mp3(sys.argv[4])
    sound.export("dest.wav", format="wav")
    print("he is done")

    path = "dest.wav"
else:
    path = sys.argv[1]

song = wave.open(path, mode='rb')

# Read frames and convert to byte array
frame_bytes = bytearray(list(song.readframes(song.getnframes())))
print(sys.argv)
# The "secret" text message
string=sys.argv[2]
# Append dummy data to fill out rest of the bytes. Receiver shall detect and remove these characters.
string = string + int((len(frame_bytes)-(len(string)*8*8))/8) *'#'
# Convert text to bit array
bits = list(map(int, ''.join([bin(ord(i)).lstrip('0b').rjust(8,'0') for i in string])))

# Replace LSB of each byte of the audio data by one bit from the text bit array
for i, bit in enumerate(bits):
    frame_bytes[i] = (frame_bytes[i] & 254) | bit
# Get the modified bytes
frame_modified = bytes(frame_bytes)

# Write bytes to a new wave audio file
with wave.open(sys.argv[3], 'wb') as fd:
    fd.setparams(song.getparams())
    fd.writeframes(frame_modified)
song.close()

print("program ended")