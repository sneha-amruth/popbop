import { usePlaylist } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";

export default function LikedVideos(){
  const { likedVideos } = usePlaylist();

    return <div className="all-videos-conatiner">
        <div className="videos-list">
          {likedVideos.length === 0 ? <div className="no-videos">You've not liked any videos yet!</div> :
            likedVideos.map(video => (
              <VideosListing key={video._id} value={video}/>
             )) 
           }
       </div>
      </div> 
}