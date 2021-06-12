import { Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "../Home/Home";
import History from "../History/History";
import Playlists from "../Playlists/Playlists";
import LikedVideos from "../LikedVideos/LikedVideos";
import WatchLater from "../WatchLater/WatchLater";
import VideoDetailPage from '../Videos/VideoDetailPage';
import Login from "../Account/Login";
import PrivateRoute from "../Account/PrivateRoute";
import NotFound from "../Account/404";
import Account from "../Account/Account";
import "./Navbar.css";
import logo from "../../assets/mybrand.png";
import SignUp from "../Account/SignUp";


export default function Navbar(){
    return(
     <>
      <div className="top-nav">
        <div className="logo">
            <img src={logo} alt="logo" />
            <h1 className="brand-name">popbop</h1>
        </div>
        <div className="search">
            <input name="search" placeholder="Search" className="search-box" />
            <button className="btn btn-icon search-icon"><i class="fas fa-search"></i></button>
     </div>
        <div className="nav-links">
            <Link to="/" className="nav-icons"><i class="fas fa-home fa-lg"></i></Link>
            <Link to="/history" className="nav-icons"><i class="fas fa-history fa-lg"></i></Link>
            <Link to="/liked" className="nav-icons"><i class="fas fa-thumbs-up fa-lg"></i></Link>
            <Link to="/watch-later" className="nav-icons"><i class="fas fa-clock fa-lg"></i></Link>
            <Link to="/playlist" className="nav-icons"><i class="fas fa-stream fa-lg"></i></Link>
            <Link to="/account" className="nav-icons"><i class="fas fa-user fa-lg "></i></Link>
        </div>
     </div>
     <div className="side-nav">
            <NavLink end to="/" className="nav-icons" activeClassName="nav-icons-active">
                <i class="fas fa-home fa-lg"></i> 
                <div className="nav-name">Home </div>
            </NavLink>
            <NavLink end to="/history" className="nav-icons" activeClassName="nav-icons-active">
                <i class="fas fa-history fa-lg"> </i>
                <div className="nav-name">History </div>
            </NavLink>
            <NavLink end to="/liked" className="nav-icons" activeClassName="nav-icons-active">
                <i class="fas fa-thumbs-up fa-lg"></i> 
                <div className="nav-name">Liked videos </div>
            </NavLink>
            <NavLink end to="/watch-later" className="nav-icons" activeClassName="nav-icons-active">
                <i class="fas fa-clock fa-lg"></i> 
                <div className="nav-name">Watch later</div>
            </NavLink>
            <NavLink end to="/playlist" className="nav-icons" activeClassName="nav-icons-active">
                <i class="fas fa-stream fa-lg"></i> 
                <div className="nav-name">Playlist </div>
            </NavLink>
     </div>

      <Routes>
        <Route path="/" element={<Home/>}> </Route>
        <Route path="/video/:videoId" element={<VideoDetailPage/>}></Route>
        <PrivateRoute path="/history">{<History/>} </PrivateRoute>
        <PrivateRoute path="/liked">{<LikedVideos/>} </PrivateRoute>
        <PrivateRoute path="/watch-later">{<WatchLater/>} </PrivateRoute>
        <PrivateRoute path="/playlist">{<Playlists/>} </PrivateRoute>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<SignUp/>} />
        <PrivateRoute path="/account" element={<Account/>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
    )
}