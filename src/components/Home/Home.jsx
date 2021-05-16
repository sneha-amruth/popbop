import videosList from "../../Database";
import VideosListing from "../Videos/VideosListing";

export default function Home(){
    
    return (
        <>
            <h1>Home</h1>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
        {videosList.map(
         video => (
            <VideosListing value={video}/>
          )
        )}
      </div>
        </>
    )
}

