import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
import { EnvironmentController } from './EnvironnementController';
import { PlayerController } from './PlayerController';

export const Shell = ({ scene, engine }) => {
      const [input, setInput] = useState({ horizontal: 0, vertical: 0 });
      const [playerMesh, setPlayerMesh] = useState(null);
      const onPlayerCreated = (player) => {
            setPlayerMesh(player);
      }
  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
      <PlayerController input={input} onPlayerCreated={onPlayerCreated}/>
    </GameObject>
  );
};