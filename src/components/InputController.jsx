import {useState, useContext, useEffect} from 'react'
import {Scalar} from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';


export const InputController = ({ onInputUpdated }) => {
  const { scene } = useContext(GameObjectContext);
  const [keys, setKeys] = useState({});

  // EFFET 1 : écouter le clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys((prevKeys) => ({ ...prevKeys, [e.key]: true }));
    };
    const handleKeyUp = (e) => {
      setKeys((prevKeys) => ({ ...prevKeys, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // EFFET 2 : traiter les inputs à chaque frame
  useEffect(() => {
    if (!scene) return;

    const processInput = () => {
      let horizontal = 0;
      if (keys['ArrowLeft'] || keys['a']) horizontal -= Scalar.Lerp(0, 1, 0.8);
      if (keys['ArrowRight'] || keys['d']) horizontal += Scalar.Lerp(0, 1, 0.8);

      let vertical = 0;
      if (keys['ArrowUp'] || keys['w']) vertical += Scalar.Lerp(0, 1, 0.3);
      if (keys['ArrowDown'] || keys['s']) vertical -= Scalar.Lerp(0, 1, 0.3);

      let jump = false;
      if (keys[' ']) jump = true;

      if (onInputUpdated) {
        onInputUpdated({ horizontal, vertical, jump });
      }
    };

    scene.registerBeforeRender(processInput);
    return () => {
      scene.unregisterBeforeRender(processInput);
    };
  }, [scene, keys]);

  return null;
}
