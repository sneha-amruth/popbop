import { usePlaylist } from "../../context/playlist-context";
import { ACTIONS } from "../../context/playlistActions";
import VideosListing from "../Videos/VideosListing";
import { restAPICalls } from "../../utils/CallRestAPI";
import "./Playlists.css";

export default function Playlists(){
    const {request} = restAPICalls();
    const { playlists, handleRemoveVideo, dispatch } = usePlaylist();


    const handlePlaylistDelete = async(playlistId) => {
        try {
            const { success} = await request({
              method: "DELETE",
              endpoint: `/api/playlist/${playlistId}`,
          });
          if(success){
            dispatch({
             type: ACTIONS.DELETE_PLAYLIST,
             payload: {playlistId}
            })
          } 
         } catch(err) {
           console.error(err);
         }
    }
    

    return (
        <div className="all-videos-conatiner">
         {playlists?.length === 0 && <div className="no-playlists">No playlist created yet!</div>} 
       { 
        playlists?.map(playlist => (
           <div className="playlist-container">
           <div className="playlist-header"><h2 key={playlist._id}>{playlist.name}</h2> <span><button className="btn btn-icon badge" onClick={() => handlePlaylistDelete(playlist._id)}><i className="fas fa-trash fa-xs"></i></button></span></div>
           {playlist.playlistVideos.length === 0 ? <div className="no-videos"><h4>No videos in this playlist yet</h4> </div> :
                  playlist.playlistVideos?.map(videoObject => (
                       <><VideosListing key={videoObject.video?._id} value={videoObject.video}/>
                        <button className="btn btn-icon badge" onClick={() => handleRemoveVideo(playlist._id, videoObject.video._id)}><i className="fas fa-trash fa-sm trash-icon"></i></button></>
                    )) 
                }
            </div>
          ))
        }
        </div>
    )
}