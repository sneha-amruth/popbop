import "./VideosListing.css";
import { Link } from "react-router-dom";
import { usePlaylist, ACTIONS } from "../../context/playlist-context";
//import HoverVideoPlayer from 'react-hover-video-player';

export default function VideosListing(props){
    const id = props.value?._id;
    const title = props.value?.title;
    const channelName = props.value?.channelName;
    const thumbnail = props.value?.thumbnail;
    //const videoUrl = props.value.videoUrl;
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
        // dispatch({
        //     type: ACTIONS.ADD_TO_HISTORY,
        //     payload: {videoId}
        // })
    }

    return (
    
       <Link to={`/video/${id}`} className="video-card"> 
       <div key={id} className="card card-md" onClick={() => handleHistory(id)}>
        <div className="thumbnail-container">
       <img src={thumbnail} alt="thumbnail" className="thumbnail" />
       </div>
        <div className="card-content">
            {/* <div className="channel-img">
            <img src={channelImgUrl} alt="channel"/>
            </div> */}
            <div className="channel-details">
                <h4>{title}</h4>
                <div className="channel-details-footer">
                    <p>{channelName}</p>
                    <p>{viewCount} views • 3 months ago</p>
                </div>
            </div>
            {/* <div>
                 <i class="fas fa-ellipsis-h"></i>
            </div> */}
        </div>
        </div> 
       </Link>
     
    )
}