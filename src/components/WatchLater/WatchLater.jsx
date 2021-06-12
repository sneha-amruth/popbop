import { usePlaylist } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";

export default function LikedVideos(){
  const { watchLaterVideos } = usePlaylist();
    
    return <div className="all-videos-conatiner">
        <div className="videos-list">
          {watchLaterVideos.length === 0 ? <div className="no-videos">No videos in this playlist yet!</div> :
            watchLaterVideos.map(video => (
              <VideosListing key={video._id} value={video}/>
             )) 
           }
       </div>
            </div> 
}