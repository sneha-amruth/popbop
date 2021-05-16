import { createContext, useContext, useReducer } from "react";
//import  videosList  from "../Database";
//import myPlaylists  from "../Database";

export const PlaylistContext = createContext();

export const ACTIONS = {
    CREATE_PLAYLIST: "create-playlist",
    ADD_TO_PLAYLIST: "add-to-playlist",
    ADD_TO_WATCHED_HISTORY: "add-to-watched-history",
    ADD_TO_LIKED: "add-to-liked"
}

export function PlaylistProvider({children}){

   
    // const getVideoDetails = (videoId) => {
    //    return videosList.find(video => video.id === videoId);
    // }
    
    const reducer = (state, action) => {
        const { playlists } = state;
        
        switch(action.type){
            
            //add to watched history
            //add to liked videos playlist
            //add to existing playlist
            //create new playlist 
            //remove video from a playlist

            case ACTIONS.CREATE_PLAYLIST:
                //const videoDetails = getVideoDetails(action.payload.videoId);
                const newPlaylist = {
                    id: action.payload.videoId+1,
                    name: action.payload.playlistName,
                    //videosList: [{...videoDetails}]
                    videosList: [action.payload.videoId]
                };
                console.log("updated playlist "+{ playlists: [...state.playlists, newPlaylist]});
                return { playlists: [...state.playlists, newPlaylist]};

            case ACTIONS.ADD_TO_PLAYLIST:
                const playlistExists = playlists.filter(playlist => playlist.name === action.payload.playlistName);
                playlistExists ?
                 { playlists: playlists.map(playlist => 
                    playlist.name === action.payload.playlistName ? {...playlist, videosList: [...playlist.videosList, action.payload.videoId]} : playlist
                )} : 
                

            default:
                return state;
        }
    }

    const [{ playlists }, dispatch] = useReducer(reducer, { playlists: [] });
   
    return (
        <PlaylistContext.Provider value={{ playlists, dispatch, reducer }}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist(){
    return useContext(PlaylistContext);
}