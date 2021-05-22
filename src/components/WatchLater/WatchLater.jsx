import { usePlaylist } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";
import  videosList  from "../../Database";

export default function LikedVideos(){
  const { watchLaterVideosId } = usePlaylist();
    
  const getVideoObject = (videoId) => {
      return videosList.filter(video => video.id === videoId);
  }

    return <div className="all-videos-conatiner">
        <div className="videos-list">
          {watchLaterVideosId.length === 0 ? <div className="no-videos">No videos in this playlist yet!</div> :
            watchLaterVideosId.map(videoId => (
              <VideosListing key={videoId} value={getVideoObject(videoId)[0]}/>
             )) 
           }
       </div>
            </div> 
}