import VideosListing from "../Videos/VideosListing";
import { useEffect, useState } from "react";
import { useLoader } from "../../context/loader-context";
import { restAPICalls } from "../../utils/CallRestAPI";
import Loader from "../Loader/Loader";
import "./Home.css";

export default function Home(){
  const {isLoading, setLoading} = useLoader();
  const {request} = restAPICalls();
  const [videosList, setVideosList] = useState();

  useEffect(() => {
    (async () => { 
      setLoading(true);
      try {
        const { data, success } = await request({
          method: "GET",
          endpoint: "/api/video",
        });
        if (success) {
            setVideosList(data);
            setLoading(false);
        } else {
          console.error("something went worng.");
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
     
    })();
   
  }, []);

    return (
      <div className="all-videos-conatiner">
        {isLoading && <Loader />}
        <div className="videos-list">
        {!isLoading && videosList && videosList.map(
         video => (
            <VideosListing value={video}/>
          )
        )}
      </div>
      </div>
    )
}

