import "./VideosListing.css";
import { Link } from "react-router-dom";
import { usePlaylist, ACTIONS } from "../../context/playlist-context";

export default function VideosListing(props){
    const id = props.value?._id;
    const title = props.value?.title;
    const channelName = props.value?.channelName;
    const thumbnail = props.value?.thumbnail;
    const viewCount = props.value?.viewCount;

    const { handleToggle, watchHistoryVideos } = usePlaylist();

    const isInWatchHistory = (videoId) => {
         return watchHistoryVideos?.find(video => video._id === videoId); 
      }
    
    function handleHistory(videoId) {
        const watched = isInWatchHistory(videoId);
        if(watched) {
            return;
        }
        handleToggle({videoId, toggle: true, type: ACTIONS.ADD_TO_HISTORY, playlist: "history"})
    }

    return (
    
       <Link to={`/video/${id}`} className="video-card"> 
       <div key={id} className="card card-md" onClick={() => handleHistory(id)}>
        <div className="thumbnail-container">
       <img src={thumbnail} alt="thumbnail" className="thumbnail" />
       </div>
        <div className="card-content">
            <div className="channel-details">
                <h4>{title}</h4>
                <div className="channel-details-footer">
                    <p>{channelName}</p>
                    <p>{viewCount} views • 3 months ago</p>
                </div>
            </div>
        </div>
        </div> 
       </Link>
     
    )
}