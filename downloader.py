from pytube import YouTube
import os, sys

url = sys.argv[1]
chatID = sys.argv[2]
msgID = sys.argv[3]

def main(url, chatID, msgID):
    yt = YouTube(url)
    video = [i for i in yt.streams.filter(only_audio=True).all() if i.mime_type == "audio/mp4"][-1]
    print(video)
    downloaded_file = video.download()
    new_file = f"storage/{chatID}-{msgID}.mp3"
    os.rename(downloaded_file, new_file)

main(url, chatID, msgID)