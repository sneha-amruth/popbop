import { usePlaylist } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";
import "./History.css";

export default function History(){
    const { watchHistoryVideos } = usePlaylist();

    return (
      <div className="all-videos-conatiner">
        <div className="videos-list">
          {watchHistoryVideos.length === 0 ? <div className="no-videos">You've not watched any videos yet!</div> :
            watchHistoryVideos.map(video => (
              <VideosListing key={video._id} value={video}/>
             )) 
           }
       </div>
       </div>
    
    )
}