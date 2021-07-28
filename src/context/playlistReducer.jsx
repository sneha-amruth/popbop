import { ACTIONS } from "./playlistActions";

export const playlistReducer = (state, action) => {
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