import { usePlaylist } from "../../context/playlist-context";
import VideosListing from "../Videos/VideosListing";
import  videosList  from "../../Database";

export default function LikedVideos(){
  const { playlists } = usePlaylist();
    
  const getVideoObject = (videoId) => {
      return videosList.filter(video => video.id === videoId);
  }

    return <div>
        <h1>Liked Videos</h1>
        
        { 
          playlists.map(playlist => (
            playlist.name === "Liked Videos" ?
           <>
          <h2>{playlist.name}</h2>
          {
                    playlist.videosList.map(videoId => (
                        <VideosListing value={getVideoObject(videoId)[0]}/>
                    )) 
                }
            </> : <></>
          ))
        }
       
    </div>
}