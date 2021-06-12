import { createContext, useContext, useReducer, useEffect } from "react";
import { restAPICalls } from "../utils/CallRestAPI";
import { useAuth } from "../context/auth-context";
import { useLoader } from "../context/loader-context";

export const PlaylistContext = createContext();

export const ACTIONS = {
    CREATE_PLAYLIST: "create-playlist",
    DELETE_PLAYLIST: "delete-playlist",
    ADD_TO_LIKED: "add-to-liked",
    REMOVE_FROM_LIKED: "remove-from-liked",
    ADD_TO_WATCH_LATER: "add-to-watch-later",
    REMOVE_FROM_WATCH_LATER: "remove-from-watch-later",
    ADD_TO_PLAYLIST: "add-to-playlist",
    REMOVE_FROM_PLAYLIST: "remove-from-playlist",
    ADD_TO_HISTORY: "add-to-history",
    SET_LIKED_VIDEOS: "set-liked-videos",
    SET_WATCH_LATER_VIDEOS: "set-watch-later-videos",
    SET_WATCH_HISTORY_VIDEOS: "set-watch-history",
    SET_PLAYLISTS: "set-playlists"
}

export function PlaylistProvider({children}){
  const { request } = restAPICalls();
  const { setLoading} = useLoader();
  const { isUserLoggedIn } = useAuth();

    const reducer = (state, action) => {
        const {playlists, likedVideos, watchLaterVideos, watchHistoryVideos} = state;
        switch(action.type){

          case ACTIONS.SET_LIKED_VIDEOS: 
            return {
              ...state,
              likedVideos: action.payload.likedVideos
            }
          case ACTIONS.SET_WATCH_LATER_VIDEOS:
            return {
              ...state,
              watchLaterVideos: action.payload.watchLaterVideos
            }
          case ACTIONS.SET_WATCH_HISTORY_VIDEOS:
          return {
            ...state,
            watchHistoryVideos: action.payload.watchHistoryVideos
          }

          case ACTIONS.SET_PLAYLISTS:
            return {
              ...state,
              playlists: action.payload.playlists
            }

            case ACTIONS.CREATE_PLAYLIST:
                return {...state, playlists: [...playlists, action.payload.newPlaylist]};
            
            case ACTIONS.DELETE_PLAYLIST:
                return {...state, playlists: playlists.filter(playlist => playlist._id !== action.payload.playlistId)}

            case ACTIONS.ADD_TO_PLAYLIST:
                return {
                    ...state,
                    playlists: playlists.map((playlist) =>
                    playlist._id === action.payload.playlistId
                      ? { ...playlist, 
                        playlistVideos: [
                        ...playlist.playlistVideos, 
                        {
                        _id: action.payload.videoId,
                        video: {
                          ...action.payload.videoObject
                        }
                      }] }
                      : playlist
                  ),
                }
            case ACTIONS.REMOVE_FROM_PLAYLIST:
                return {
                    ...state,
                    playlists: playlists.map((playlist) =>
                    playlist._id === action.payload.playlistId
                      ? { ...playlist, playlistVideos: playlist.playlistVideos.filter(videoObject => videoObject.video._id !== action.payload.videoId) }
                      : playlist
                  ),
                };

            case ACTIONS.ADD_TO_LIKED:
                return {...state, likedVideos: [...likedVideos, action.payload]}

            case ACTIONS.REMOVE_FROM_LIKED:
                return {...state, likedVideos: likedVideos.filter(video => video._id !== action.payload._id )}
            
            case ACTIONS.ADD_TO_WATCH_LATER:
                return {...state, watchLaterVideos: [...watchLaterVideos, action.payload]}

            case ACTIONS.REMOVE_FROM_WATCH_LATER:
                return {...state, watchLaterVideos: watchLaterVideos.filter(video => video._id !== action.payload._id )}
            
            case ACTIONS.ADD_TO_HISTORY:
            return {...state, watchHistoryVideos: [...watchHistoryVideos, action.payload]}

            default:
                return state;
        }
    }
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
          console.error(err);
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
         console.error(err);
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
       console.error(err);
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
            console.log("in fetching liked "+data.likedVideos);
            setLoading(false);
            setLikedVideos({likedVideos: data.likedVideos});
            setWatchLaterVideos({watchLaterVideos: data.watchLater});
            setWatchHistoryVideos({watchHistoryVideos: data.historyVideos})
          }
        } catch(err){
          console.log("errr");
          setLoading(false);
          console.error(err);
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
          console.error(err);
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
    }, [isUserLoggedIn])
    
   const [{playlists, likedVideos, watchLaterVideos, watchHistoryVideos }, dispatch] = useReducer(reducer, {playlists: [], likedVideos: [], watchLaterVideos: [], watchHistoryVideos: []});
  
    return (
        <PlaylistContext.Provider value={{ playlists, likedVideos, handleToggle, watchLaterVideos, watchHistoryVideos, handleAddVideo, handleRemoveVideo, dispatch, reducer }}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist(){
    return useContext(PlaylistContext);
}