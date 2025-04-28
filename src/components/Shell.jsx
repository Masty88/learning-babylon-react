import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
//import {CameraController} from './CameraController';
import {EnvironmentController} from './EnvironnementController';
import {PlayerController} from './PlayerController';
import {InputController} from './InputController';

export const Shell = ({ scene, engine }) => {

  const [input, setInput] = useState({
    horizontal: 0,
    vertical: 0,
  });

  const onInputUpdated = (values) => {
    setInput(values)
  }

  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
      <PlayerController input={input}/>
       {/* {playerMesh && <CameraController playerMesh={playerMesh} />} */}
      <InputController onInputUpdated={onInputUpdated } />
    </GameObject>
  );
};
