import { createContext, useContext, useReducer, useEffect } from "react";
import { restAPICalls } from "../utils/CallRestAPI";
import { useAuth } from "../context/auth-context";
import { useLoader } from "../context/loader-context";
import { playlistReducer } from "./playlistReducer";
import { ACTIONS } from "./playlistActions";

export const PlaylistContext = createContext();

export function PlaylistProvider({children}){
  const { request } = restAPICalls();
  const { setLoading} = useLoader();
  const { isUserLoggedIn } = useAuth();

   
    const handleToggle = async ({videoId, toggle, type, playlist}) => {
      if(isUserLoggedIn){
        try {
           const {data, success} = await request({
             method: toggle ? "POST" : "DELETE",
             endpoint: `/api/${playlist}/${videoId}`,
         });
         if(success){
           dispatch({
             type: type,
             payload: data
           })
          }
        } catch(err) {
          console.error(err.message);
        }
      }
    }
    
    const handleRemoveVideo = async(playlistId, videoId) => {
      try {
          const { success } = await request({
            method: "DELETE",
            endpoint: `/api/playlist/${playlistId}/${videoId}`,
        });
        if(success){
          dispatch({
           type: ACTIONS.REMOVE_FROM_PLAYLIST,
           payload: {playlistId, videoId}
          })
        } 
       } catch(err) {
         console.error(err.message);
       }
  }
  const handleAddVideo = async(playlistId, videoId, videoObject) => {
    try {
        const { success } = await request({
          method: "POST",
          endpoint: `/api/playlist/${playlistId}/${videoId}`,
      });
      if(success){
        dispatch({
          type: ACTIONS.ADD_TO_PLAYLIST,
          payload: {playlistId, videoId, videoObject}
      })
      } 
     } catch(err) {
       console.error(err.message);
     }
}
  
    const setLikedVideos = ({likedVideos}) => {
      dispatch({ 
        type: ACTIONS.SET_LIKED_VIDEOS, payload: { likedVideos }
      });
    }
    const setWatchLaterVideos = ({watchLaterVideos}) => {
      dispatch({ 
        type: ACTIONS.SET_WATCH_LATER_VIDEOS, payload: { watchLaterVideos }
      });
    }
    const setWatchHistoryVideos = ({watchHistoryVideos}) => {
      dispatch({ 
        type: ACTIONS.SET_WATCH_HISTORY_VIDEOS, payload: { watchHistoryVideos }
      });
    }
    const setPlaylists = ({playlists}) => {
      dispatch({
        type: ACTIONS.SET_PLAYLISTS, payload: {playlists}
      });
    }

    const fetchData = () => {
      (async () => {
        setLoading(true);
        try {
          const { data, success } = await request({
            method: "GET",
            endpoint: `/api/default`
          });
          if(success) {
            setLoading(false);
            setLikedVideos({likedVideos: data.likedVideos});
            setWatchLaterVideos({watchLaterVideos: data.watchLater});
            setWatchHistoryVideos({watchHistoryVideos: data.historyVideos})
          }
        } catch(err){
          setLoading(false);
          console.error(err.message);
        }
      })();
      (async () => {
        setLoading(true);
        try {
          const { data, success } = await request({
            method: "GET",
            endpoint: `/api/playlist`
          });
          if(success) {
            setLoading(false);
            setPlaylists({playlists: data})
          }
        } catch(err){
          setLoading(false);
          console.error(err.message);
        }
      })();
    }

    useEffect(() => {
      if(isUserLoggedIn){
        fetchData();
      } else {
        setLikedVideos({likedVideos: []});
        setWatchLaterVideos({watchLaterVideos: []});
      }
      // eslint-disable-next-line
    }, [isUserLoggedIn])
    
   const [{playlists, likedVideos, watchLaterVideos, watchHistoryVideos }, dispatch] = useReducer(playlistReducer, {playlists: [], likedVideos: [], watchLaterVideos: [], watchHistoryVideos: []});
  
    return (
        <PlaylistContext.Provider value={{ playlists, likedVideos, handleToggle, watchLaterVideos, watchHistoryVideos, handleAddVideo, handleRemoveVideo, dispatch }}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist(){
    return useContext(PlaylistContext);
}