import ReactPlayer from "react-player";
import { useParams } from "react-router-dom";
import videosList from "../../Database";
import { usePlaylist, ACTIONS } from "../../context/playlist-context";
import { useState } from "react";

export default function VideoDetailPage(){
  const { videoId } = useParams();

  const getVideoDetails = (videoId) => {
    return videosList.find(video => video.id === videoId);
  }

  const video = getVideoDetails(videoId);
  const id = video.id;
  const title = video.title;
  const channelName = video.channelName;
  //const thumbnail = video.thumbnail;
  const channelImgUrl = video.channelImgUrl;
  const videoUrl = video.videoUrl;


  const [playlistName, setPlaylistName] = useState("")

  const { dispatch } = usePlaylist();

  function handleChange(event){
          setPlaylistName(event.target.value);
  }

  function handleCreate(playlistName,videoId){
    dispatch({
          type: ACTIONS.CREATE_PLAYLIST,
          payload: {playlistName, videoId}
      })
  }

  function handleLike(videoId){
      dispatch({
        type: ACTIONS.ADD_TO_PLAYLIST,
        payload: {playlistName: "Liked Videos", videoId}
      })
  }

  return (
    <div>
    <ReactPlayer url={videoUrl} playing={true} width={"1000px"} height={"600px"}/>
    <h3>{title}</h3>
   <img src={channelImgUrl} alt="channelImage"/> <h4>{channelName}</h4>
    <button onClick={() => handleLike(id)} className={"btn btn-icon"}> <i class="far fa-thumbs-up"></i></button>
    <div>
    <input type="text" name="playlistName" onChange={handleChange} className="input-box"/>
    <button onClick={() => handleCreate(playlistName,id)} className={"btn btn-primary"}>Save</button>
    </div>
  </div>
  )

}