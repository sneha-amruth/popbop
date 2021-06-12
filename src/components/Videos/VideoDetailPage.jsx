import ReactPlayer from "react-player";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePlaylist, ACTIONS } from "../../context/playlist-context";
import Modal from "../Modal/Modal";
import Loader  from "../Loader/Loader";
import { useLoader } from "../../context/loader-context";
import { restAPICalls } from "../../utils/CallRestAPI";
import "./VideoDetailPage.css";

export default function VideoDetailPage(){
  const {isLoading, setLoading} = useLoader();
  const {request} = restAPICalls();

  const { videoId } = useParams();
  const [videoDetails, setVideoDetails] = useState();
  const { dispatch, likedVideos, handleLikeToggle, watchLaterVideosId } = usePlaylist();
 
  const isVideoLiked = (videoId) => {
    return  likedVideos?.find(video => video._id === videoId);
  }
  const [likeToggle, setLikeToggle] = useState(isVideoLiked(videoId));

  const isInWatchLater = (videoId) => {
    return watchLaterVideosId.find(video => video === videoId);
  }
  const [watchLaterToggle, setwatchLaterToggle] = useState(isInWatchLater(videoId));

  useEffect(() => {
    (async () => { 
      setLoading(true);
      try {
        const { data, success } = await request({
          method: "GET",
          endpoint: `/api/video/${videoId}`,
        });
        if (success) {
          setVideoDetails(data);
            setLoading(false);
        } else {
          console.error("something went worng.");
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
     
    })();
   
  }, []);

  function handleLike(videoId){
    if(likeToggle){
      setLikeToggle(!likeToggle);
      handleLikeToggle({videoId, like: false, type: ACTIONS.REMOVE_FROM_LIKED})
    }else {
      setLikeToggle(!likeToggle);
      handleLikeToggle({videoId, like: true, type: ACTIONS.ADD_TO_LIKED})
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
    <>
    {isLoading && <Loader />}
    {!isLoading && videoDetails && 
    <div key={videoDetails._id} className="video-player-container">
    <ReactPlayer url={videoDetails.videoUrl} playing={true} width={"1500px"} height={"550px"}/>
    <div className="card-content video-play">
            {/* <img src={channelImgUrl} alt="channel"/> */}
            <div className="channel-details">
                <div className="video-tile">{videoDetails.title}</div>
                <div className="channel-details-footer">
                    <p>{videoDetails.channelName}</p>
                    <p>{videoDetails.viewCount} views • 3 months ago</p>
                </div>
            </div>
            <div className="save-video">
            <button onClick={() => handleLike(videoDetails._id)} className="btn btn-icon"> <i className={likeToggle ?  "fas fa-thumbs-up liked-icon thumbs-up" : "fas fa-thumbs-up thumbs-up"}></i></button>
            <button onClick={() => handleWatchLater(videoDetails._id)} className="btn btn-icon"> <i className={watchLaterToggle ?  "fas fa-clock fa-lg watch-later clock" : "fas fa-clock fa-lg clock"}></i></button>  
            <Modal value={videoDetails}/>
            </div>
    </div>
  </div>}
  </>
  )

}