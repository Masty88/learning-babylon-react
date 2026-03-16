import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
import { EnvironmentController } from './EnvironnementController';
import { PlayerController } from './PlayerController';
import { InputController } from './InputController';
import { CameraController } from './CameraController';

export const Shell = ({ scene, engine }) => {
      const [input, setInput] = useState({ horizontal: 0, vertical: 0 });
      const [playerMesh, setPlayerMesh] = useState(null);
      const onPlayerCreated = (player) => {
            setPlayerMesh(player);
      }
      const onInputUpdated = (values) => {
            setInput(values);
      }
  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
      <InputController onInputUpdated={onInputUpdated} />
      <PlayerController input={input} onPlayerCreated={onPlayerCreated}/>
      {playerMesh && <CameraController playerMesh={playerMesh} />}
    </GameObject>
  );
};