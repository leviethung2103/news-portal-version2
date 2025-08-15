# """
# A script to fetch and display YouTube video metadata, including the description,
# given a video URL. Uses the pytube library.
# """

# from typing import Optional
# import youtube_dl


# def get_video_info(url: str) -> Optional[dict]:
#     """
#     Fetch metadata for a YouTube video, including title, author, publish date,
#     description, and length.

#     Parameters:
#     url (str): The URL of the YouTube video.

#     Returns:
#     Optional[dict]: Dictionary with video metadata, or None if fetch fails.
#     """
#     """
#     Fetch metadata for a YouTube video using youtube_dl, including title, uploader, upload date,
#     description, duration, view count, like count, and more.

#     Parameters:
#     url (str): The URL of the YouTube video.

#     Returns:
#     Optional[dict]: Dictionary with video metadata, or None if fetch fails.
#     """
#     try:
#         ydl_opts = {
#             "quiet": True,
#             "skip_download": True,
#             "forcejson": True,
#         }
#         with youtube_dl.YoutubeDL(ydl_opts) as ydl:
#             info = ydl.extract_info(url, download=False)
#             return {
#                 "title": info.get("title"),
#                 "uploader": info.get("uploader"),
#                 "upload_date": info.get("upload_date"),
#                 "description": info.get("description"),
#                 "duration": info.get("duration"),
#                 "view_count": info.get("view_count"),
#                 "like_count": info.get("like_count"),
#                 "dislike_count": info.get("dislike_count"),
#                 "average_rating": info.get("average_rating"),
#                 "categories": info.get("categories"),
#                 "tags": info.get("tags"),
#                 "channel_url": info.get("channel_url"),
#                 "thumbnail": info.get("thumbnail"),
#                 "webpage_url": info.get("webpage_url"),
#             }
#     except Exception as e:
#         print(f"Error fetching video info: {e}")
#         return None


# def main() -> None:
#     """
#     Main function to prompt user for a YouTube video URL and display metadata.
#     """
#     url = input("Enter the YouTube video URL: ").strip()
#     info = get_video_info(url)
#     if info:
#         print("\nVideo Information:")
#         for key, value in info.items():
#             print(f"{key}: {value}")
#     else:
#         print("Failed to retrieve video information.")


# if __name__ == "__main__":
#     main()

# importing pafy
import pafy 
  
# url of video 
url = "https://www.youtube.com/watch?v=tbDDYKRFjhk&t=774s"
  
# getting video
video = pafy.new(url) 

# getting meta data of video
value = video.__repr__()

# printing the value
print("Meta Data : " + value)