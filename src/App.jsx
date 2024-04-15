import { useRef, useState, useEffect } from 'react';

import Places from './components/Places.jsx';
import { AVAILABLE_PLACES } from './data.js';
import Modal from './components/Modal.jsx';
import DeleteConfirmation from './components/DeleteConfirmation.jsx';
import logoImg from './assets/logo.png';
import { sortPlacesByDistance } from './loc.js';

//side effect for fetching picked places from local storage if previously added. 
//This sideeffect needs to be done only once so putting outside App.
//It dont need useEffect hook also because it is synchrounous execution and we dont need to wait
const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
const storedPlaces = storedIds.map((id) => AVAILABLE_PLACES.find((place) => place.id === id));

function App() {
  const modal = useRef();
  const selectedPlace = useRef();
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [pickedPlaces, setPickedPlaces] = useState(storedPlaces);

  /*
  The anonymous function defined in useEfffect wiil be executed by React 
  after every time the component execution is done.
  Execution Sequence:
  1. First App will be executed and rendered, 
  2.then annonymous function inside useEffect, then as it updates state, 
  3. so App will be executed and rendered again. 
  4. Now useEffect function should be executed second time or not depends
  if any dependencies change. Omiting [] dependencies array will call useEffect again.
  Empty [] will not call useEffect again.
  */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const sortedPlaces = sortPlacesByDistance(
        AVAILABLE_PLACES,
        position.coords.latitude,
        position.coords.longitude
      );
      setAvailablePlaces(sortedPlaces);
    });
  },[]);  

  function handleStartRemovePlace(id) {
    modal.current.open();
    selectedPlace.current = id;
  }

  function handleStopRemovePlace() {
    modal.current.close();
  }

  function handleSelectPlace(id) {
    setPickedPlaces((prevPickedPlaces) => {
      if (prevPickedPlaces.some((place) => place.id === id)) {
        return prevPickedPlaces;
      }
      const place = AVAILABLE_PLACES.find((place) => place.id === id);
      return [place, ...prevPickedPlaces];
    });

    //Below sideeffect does not require useEffect hook. Not all sideeffect need useEffect hook.
    //We are adding selected place id in local storage, so that we can get it back in next browser reload
    const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
    //if not in local storage already, then we add id
    if(storedIds.indexOf(id) === -1){
      localStorage.setItem('selectedPlaces',JSON.stringify([id,...storedIds]));
    }
   
  }

  function handleRemovePlace() {
    setPickedPlaces((prevPickedPlaces) =>
      prevPickedPlaces.filter((place) => place.id !== selectedPlace.current)
    );
    modal.current.close();

    //remove deleted place id from local storage, and filter only remaining place ids to set in localstorage for next time rendering
    const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
    localStorage.setItem('selectedPlaces',JSON.stringify(storedIds.filter((id) => id !== selectedPlace.current)));
  }

  return (
    <>
      <Modal ref={modal}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        <Places
          title="I'd like to visit ..."
          fallbackText={'Select the places you would like to visit below.'}
          places={pickedPlaces}
          onSelectPlace={handleStartRemovePlace}
        />
        <Places
          title="Available Places"
          places={availablePlaces}
          fallbackText="Sorting places by distance..."
          onSelectPlace={handleSelectPlace}
        />
      </main>
    </>
  );
}

export default App;
