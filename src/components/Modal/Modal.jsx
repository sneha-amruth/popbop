import { useState } from "react";
import { usePlaylist } from "../../context/playlist-context";
import { ACTIONS } from "../../context/playlistActions";
import { useAuth } from "../../context/auth-context";
import { restAPICalls } from "../../utils/CallRestAPI";
import { useNavigate } from "react-router-dom";
import "./Modal.css";

export default function Modal(props){
    const videoObject = props.value;
    const videoId = props.value._id;
    const { playlists, handleAddVideo, handleRemoveVideo, dispatch } = usePlaylist();
    const { isUserLoggedIn } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [playlistName, setPlaylistName] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [showRequiredError, setShowRequiredError] = useState(false);
    const {request} = restAPICalls();
    const navigate = useNavigate();

    function handleModal(toggle){
        if(!isUserLoggedIn){
            navigate("/login");
          }
        toggle ? setShowModal(true) : setShowModal(false);
        setShowInput(false);
        setShowRequiredError(false);
    }
    function isVideoInPlaylist(playlistName, playlistId, videoId){
       const currPlaylist = playlists.filter(playlist => playlist._id === playlistId)[0];
       return currPlaylist.playlistVideos?.find(videoObject => videoObject.video?._id === videoId);
    }

    const handleCheckboxChange = async(event, playlistId, videoId, videoObject) => {
        const checked = event.target.checked;
        if(checked)
            handleAddVideo(playlistId, videoId, videoObject);
        else 
            handleRemoveVideo(playlistId, videoId);
    }
    
function handleChange(event){
    setPlaylistName(event.target.value);
    setShowRequiredError(false);
}
function handleClick(){
    setShowInput(!showInput);
}

const  handleCreate = async (playlistName,videoId) => {
    if(isUserLoggedIn){
        if(playlistName === ""){
            setShowRequiredError(true);
            return;
        }
       setPlaylistName("");
        try {
           const {data, success} = await request({
             method: "POST",
             endpoint: `/api/playlist/${videoId}`,
             body: {
                 "name": playlistName
             }
         });
         
         if(success){
           dispatch({
            type: ACTIONS.CREATE_PLAYLIST,
            payload: {newPlaylist: data}
           })
         } 
        } catch(err) {
          console.error(err);
        }
      }
}

return (
    <>
    {showModal ? 
        <div className="modal card card-md">
            <div className="modal-content">
            <div className="modal-header">
              <div className="title">Add to Playlist...</div>
              <button onClick={() => handleModal(false)} className="btn btn-icon"><i className="fas fa-times"></i></button>
            </div>
            { playlists.map(playlist => (
                <div className="modal-list"> 
                <div className="checkbox-container">
                    <input name={playlist.name} value={playlist.name} type="checkbox"  checked={isVideoInPlaylist(playlist.name,playlist._id,videoId)} onChange={(event) => handleCheckboxChange(event, playlist._id, videoId, videoObject)} />
                </div>
                <label> {playlist.name} </label>
            </div>
            ))}
                <div className="modal-footer">
                { showInput ? 
                 <> 
                 <label className={ showRequiredError ? "requiredError" : ""}>Name</label> 
                 <input type="text" name={playlistName} value={playlistName} placeholder="Enter playlist name..." onChange={handleChange} className={showRequiredError ? "input-box-required input-box" : "input-box"}/>
                 {showRequiredError ? <p className="requiredError">Required</p> : ""}
                 </> : ""}
            {showInput ?     
             <button onClick={() => handleCreate(playlistName,videoId)} className="btn btn-primary create-playlist" type="submit">CREATE</button> :
             <button onClick={handleClick} className="btn btn-primary"><i className="fas fa-plus fa-xs"></i> Create new playlist</button> 
            }
           </div>
           </div>
        </div> : 
            <div className="save-btn">
            <button onClick={() => handleModal(true)} className="btn btn-primary"><i className="fas fa-stream fa-lg"></i> SAVE</button>
            </div>
        }
        </>
    )
}