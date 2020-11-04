import React , { useCallback , useState , useEffect } from 'react';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker, InfoWindow, useLoadScript, Circle } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import { Event } from '../../models/event';

const API_KEY = 'AIzaSyA3nI9aB4gqX8stDIQer2-q3AzK2lrsKIs';
const libraries: Libraries = ["places"];
const mapContainerStyle = {
    width: '100%',
    height: '100%'
};
const center = {
    lat: 31,
    lng: 35
};
const options = {
    style: [
        {
          featureType: "all",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        }]
}

const AllEventsGM: React.FC = () => {

    const [allEvents , setAllEvents] = useState<Event[]>();

    const getAllEvents: () => Promise<void> = async () => {
        const { data } = await axios({
            method: "get",
            url: 'http://localhost:3001/events/all'
        });
        console.log(data);
        setAllEvents(data);
    }

    useEffect(() => {
      getAllEvents();
    },[]);

    const {isLoaded, loadError} = useLoadScript({
        googleMapsApiKey: API_KEY,
        libraries: libraries
    });
    if(loadError) return <div>Error Loading</div>;
    if(!isLoaded) return <div>Loading Maps</div>;

    return (
        <div id="allEventsGM" style={{gridArea: '1 / 3 / 2 / 7'}}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={2}
                center={center}
                options={options}
            >
                {
                    allEvents &&
                    allEvents.map((event) => {
                        return (
                            <Marker 
                                position={{
                                    lat: event.geolocation.location.lat,
                                    lng: event.geolocation.location.lng
                                }}>
                            </Marker>
                        )
                    })
                }
                
            </GoogleMap>
        </div>
    );
}

export default AllEventsGM ;
