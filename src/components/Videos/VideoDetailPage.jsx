import ReactPlayer from "react-player";
import { useState } from "react";
import { useParams } from "react-router-dom";
import videosList from "../../Database";
import { usePlaylist, ACTIONS } from "../../context/playlist-context";
import Modal from "../Modal/Modal";
import "./VideoDetailPage.css";

export default function VideoDetailPage(){
  const { videoId } = useParams();
  const { dispatch, likedVideosId, watchLaterVideosId } = usePlaylist();

  const isVideoLiked = (videoId) => {
    return likedVideosId.find(video => video === videoId);
  }
  const [likeToggle, setLikeToggle] = useState(isVideoLiked(videoId));

  const isInWatchLater = (videoId) => {
    return watchLaterVideosId.find(video => video === videoId);
  }
  const [watchLaterToggle, setwatchLaterToggle] = useState(isInWatchLater(videoId));

  const getVideoDetails = (videoId) => {
    return videosList.find(video => video.id === videoId);
  }

  const video = getVideoDetails(videoId);
  const id = video.id;
  const title = video.title;
  const channelName = video.channelName;
  const channelImgUrl = video.channelImgUrl;
  const videoUrl = video.videoUrl;
  const viewCount = video.viewCount;

  function handleLike(videoId){
    if(likeToggle){
      setLikeToggle(!likeToggle);
      dispatch({
        type: ACTIONS.REMOVE_FROM_LIKED,
        payload: {videoId}
      })
    }else {
      setLikeToggle(!likeToggle);
      dispatch({
        type: ACTIONS.ADD_TO_LIKED,
        payload: {videoId}
      })
    }
  }
  function handleWatchLater(videoId){
    if(watchLaterToggle){
      setwatchLaterToggle(!watchLaterToggle);
      dispatch({
        type: ACTIONS.REMOVE_FROM_WATCH_LATER,
        payload: {videoId}
      })
    }else {
      setwatchLaterToggle(!watchLaterToggle);
      dispatch({
        type: ACTIONS.ADD_TO_WATCH_LATER,
        payload: {videoId}
      })
    }
  }
 

  
  return (
    <div key={id} className="video-player-container">
    <ReactPlayer url={videoUrl} playing={false} width={"1500px"} height={"550px"}/>
    <div className="card-content video-play">
            {/* <img src={channelImgUrl} alt="channel"/> */}
            <div className="channel-details">
                <div className="video-tile">{title}</div>
                <div className="channel-details-footer">
                    <p>{channelName}</p>
                    <p>{viewCount} views • 3 months ago</p>
                </div>
            </div>
            <div className="save-video">
            <button onClick={() => handleLike(id)} className="btn btn-icon"> <i className={likeToggle ?  "fas fa-thumbs-up liked-icon thumbs-up" : "fas fa-thumbs-up thumbs-up"}></i></button>
            <button onClick={() => handleWatchLater(id)} className="btn btn-icon"> <i className={watchLaterToggle ?  "fas fa-clock fa-lg watch-later clock" : "fas fa-clock fa-lg clock"}></i></button>  
            <Modal value={id}/>
            </div>
    </div>
  </div>
  )

}