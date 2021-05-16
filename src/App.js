import './App.css';
import {Routes, Route, Link} from "react-router-dom";
import Home from "./components/Home/Home";
import History from "./components/History/History";
import Playlists from "./components/Playlists/Playlists";
import LikedVideos from "./components/LikedVideos/LikedVideos";
import VideoDetailPage from './components/Videos/VideoDetailPage';

function App() {
  return (
    <div className="App">
      <Link to="/">Home</Link> {" || "}
      <Link to="/history">History</Link>{" || "}
      {/* <Link to="/playlist/:listId">Liked videos</Link>{" || "} */}
      <Link to="/liked">Liked videos</Link>{" || "}
      <Link to="/playlist">Playlists</Link>
      <Routes>
        <Route path="/" element={<Home/>}> </Route>
        <Route path="/video/:videoId" element={<VideoDetailPage/>}></Route>
        <Route path="/history">{<History/>} </Route>
        {/* <Route path="/playlist">{<LikedVideos/>} </Route> */}
        <Route path="/liked">{<LikedVideos/>} </Route>
        <Route path="/playlist">{<Playlists/>} </Route>
      </Routes>
    </div>
  );
}

export default App;
