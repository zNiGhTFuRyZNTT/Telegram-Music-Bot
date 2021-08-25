from pytube import YouTube
import os, sys

url = sys.argv[1]
chatID = sys.argv[2]
msgID = sys.argv[3]

def main(url, chatID, msgID, path):
    yt = YouTube(url)
    video = yt.streams.filter(only_audio=True).first()
    downloaded_file = video.download("storage/")
    base, ext = os.path.splitext(downloaded_file)
    new_file = f"{chatID}-{msgID}.mp3"
    os.rename(downloaded_file, new_file)

main(url, chatID, msgID)