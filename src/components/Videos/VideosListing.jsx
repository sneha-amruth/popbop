import "./VideosListing.css";
import { Link } from "react-router-dom";

export default function VideosListing(props){
    const id = props.value.id;
    const title = props.value.title;
    const channelName = props.value.channelName;
    const channelImgUrl = props.value.channelImgUrl;
    const thumbnail = props.value.thumbnail;

    return (
       <Link to={`/video/${id}`}> 
       <div key={id} className={"card card-md"} >
       <img src={thumbnail} alt="thumbnail" className={"thumbnail"} />
        <div className={"card-content"}>
            <h4>{title}</h4>
            <p>{channelName}</p>
            <img src={channelImgUrl} alt="channel" style={{maxWidth: "5rem", maxHeight: "5rem"}}/>
        </div>
        </div> 
       </Link>
    )
}