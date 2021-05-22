import { usePlaylist } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";
import  videosList  from "../../Database";
import "./History.css";

export default function History(){
    const { watchedHistoryVideosId } = usePlaylist();

    const getVideoObject = (videoId) => {
        return videosList.filter(video => video.id === videoId);
    }

    return (
      <div className="all-videos-conatiner">
        <div className="videos-list">
          {watchedHistoryVideosId.length === 0 ? <div className="no-videos">You've not watched any videos yet!</div> :
            watchedHistoryVideosId.map(videoId => (
              <VideosListing key={videoId} value={getVideoObject(videoId)[0]}/>
             )) 
           }
       </div>
       </div>
    
    )
}