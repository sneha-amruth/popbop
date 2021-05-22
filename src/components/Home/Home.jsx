import videosList from "../../Database";
import VideosListing from "../Videos/VideosListing";
import "./Home.css";

export default function Home(){
    
    return (
      <div className="all-videos-conatiner">
        <div className="videos-list">
        {videosList.map(
         video => (
            <VideosListing value={video}/>
          )
        )}
      </div>
      </div>
    )
}

