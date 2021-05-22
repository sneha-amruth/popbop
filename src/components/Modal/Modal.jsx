import { useState } from "react";
import { usePlaylist, ACTIONS } from "../../context/playlist-context";
import "./Modal.css";

export default function Modal(props){
    const id = props.value;
    const { playlists, dispatch } = usePlaylist();
    const [showModal, setShowModal] = useState(false);
    const [playlistName, setPlaylistName] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [showRequiredError, setShowRequiredError] = useState(false);

    function handleModal(toggle){
        toggle ? setShowModal(true) : setShowModal(false);
        setShowInput(false);
        setShowRequiredError(false);
    }
    function isVideoInPlaylist(playlistName, videoId){
       const currPlaylist = playlists.filter(playlist => playlist.name === playlistName)[0];
       return currPlaylist.videos?.find(video => video === videoId);
    }

    function handleCheckboxChange(event, playlistId, videoId){
        const checked = event.target.checked;
        if(checked){
            dispatch({
                type: ACTIONS.ADD_TO_PLAYLIST,
                payload: {playlistId, videoId}
            })
        }else {
            dispatch({
                type: ACTIONS.REMOVE_FROM_PLAYLIST,
                payload: {playlistId, videoId}
            })
        }
    }
    
function handleChange(event){
    setPlaylistName(event.target.value);
    setShowRequiredError(false);
}
function handleClick(){
    setShowInput(!showInput);
}

function handleCreate(playlistName,videoId){
    if(playlistName === ""){
        setShowRequiredError(true);
        return;
    }
  setPlaylistName("");
  dispatch({
        type: ACTIONS.CREATE_PLAYLIST,
        payload: {playlistName, videoId}
    });
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
                    <input name={playlist.name} value={playlist.name} type="checkbox"  checked={isVideoInPlaylist(playlist.name,id)} onChange={(event) => handleCheckboxChange(event, playlist.id, id)} />
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
             <button onClick={() => handleCreate(playlistName,id)} className="btn btn-primary create-playlist" type="submit">CREATE</button> :
             <button onClick={handleClick} className="btn btn-primary"><i class="fas fa-plus fa-xs"></i> Create new playlist</button> 
            }
           </div>
           </div>
        </div> : 
            <div className="save-btn">
            <button onClick={() => handleModal(true)} className="btn btn-primary"><i class="fas fa-stream fa-lg"></i> SAVE</button>
            </div>
        }
        </>
    )
}