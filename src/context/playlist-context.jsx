import { createContext, useContext, useReducer } from "react";
//import  videosList  from "../Database";
import uuid from 'react-uuid';

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
    ADD_TO_HISTORY: "add-to-history"   
}

export function PlaylistProvider({children}){
    const reducer = (state, action) => {
        const {playlists, likedVideosId, watchLaterVideosId, watchedHistoryVideosId} = state;
        switch(action.type){

            case ACTIONS.CREATE_PLAYLIST:
                const newPlaylist = {
                    id: uuid(),
                    name: action.payload.playlistName,
                    videos: [action.payload.videoId]
                };
                return {...state, playlists: [...playlists, newPlaylist]};
            
            case ACTIONS.DELETE_PLAYLIST:
                return {...state, playlists: playlists.filter(playlist => playlist.id !== action.payload.playlistId)}

            case ACTIONS.ADD_TO_PLAYLIST:
                return {
                    ...state,
                    playlists: playlists.map((playlist) =>
                    playlist.id === action.payload.playlistId
                      ? { ...playlist, videos: playlist.videos.concat(action.payload.videoId) }
                      : playlist
                  ),
                }
            case ACTIONS.REMOVE_FROM_PLAYLIST:
                return {
                    ...state,
                    playlists: playlists.map((playlist) =>
                    playlist.id === action.payload.playlistId
                      ? { ...playlist, videos: playlist.videos.filter(video => video !== action.payload.videoId) }
                      : playlist
                  ),
                };

            case ACTIONS.ADD_TO_LIKED:
                return {...state, likedVideosId: [...likedVideosId, action.payload.videoId]}

            case ACTIONS.REMOVE_FROM_LIKED:
                return {...state, likedVideosId: likedVideosId.filter(videoId => videoId !== action.payload.videoId )}
            
                case ACTIONS.ADD_TO_WATCH_LATER:
                    return {...state, watchLaterVideosId: [...watchLaterVideosId, action.payload.videoId]}
    
                case ACTIONS.REMOVE_FROM_WATCH_LATER:
                    return {...state, watchLaterVideosId: watchLaterVideosId.filter(videoId => videoId !== action.payload.videoId )}
                
                case ACTIONS.ADD_TO_HISTORY:
                return {...state, watchedHistoryVideosId: [...watchedHistoryVideosId, action.payload.videoId]}

            default:
                return state;
        }
    }

   const [{playlists, likedVideosId, watchLaterVideosId, watchedHistoryVideosId }, dispatch] = useReducer(reducer, {playlists: [], likedVideosId: [], watchLaterVideosId: [], watchedHistoryVideosId: []});
  
    return (
        <PlaylistContext.Provider value={{ playlists, likedVideosId, watchLaterVideosId, watchedHistoryVideosId, dispatch, reducer }}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist(){
    return useContext(PlaylistContext);
}