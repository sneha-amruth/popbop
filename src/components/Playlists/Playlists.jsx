import { usePlaylist, ACTIONS } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";
import  videosList  from "../../Database";
import "./Playlists.css";

export default function Playlists(){
    const { playlists, dispatch } = usePlaylist();
    
    const getVideoObject = (videoId) => {
        return videosList.filter(video => video.id === videoId);
    }

    function handleRemoveVideo(playlistId, videoId){
        dispatch({
            type: ACTIONS.REMOVE_FROM_PLAYLIST,
            payload: {playlistId, videoId}
        })
    }
    function handlePlaylistDelete(playlistId){
        dispatch({
            type: ACTIONS.DELETE_PLAYLIST,
            payload: {playlistId}
        })
    }

    return (
        <div className="all-videos-conatiner">
         {playlists.length === 0 && <div className="no-playlists">No playlist created yet!</div>} 
       { 
        playlists.map(playlist => (
           <div className="playlist-container">
           <div className="playlist-header"><h2 key={playlist.id}>{playlist.name}</h2> <span><button className="btn btn-icon badge" onClick={() => handlePlaylistDelete(playlist.id)}><i className="fas fa-trash fa-xs"></i></button></span></div>
           {playlist.videos.length === 0 ? <div className="no-videos"><h4>No videos in this playlist yet</h4> </div> :
                  playlist.videos?.map(videoId => (
                       <><VideosListing key={videoId} value={getVideoObject(videoId)[0]}/>
                        <button className="btn btn-icon badge" onClick={() => handleRemoveVideo(playlist.id, videoId)}><i className="fas fa-trash fa-sm trash-icon"></i></button></>
                    )) 
                }
            </div>
          ))
        }
        </div>
    )
}