import React from 'react';
import {useState, useCallback} from 'react'
import {SceneComponent} from './components/SceneComponent';
import {ArcRotateCamera, Vector3} from '@babylonjs/core';
import {Shell} from './components/Shell'
import './App.css';


const App = () => {
  const [sceneState, setSceneState] = useState()
  const [engineState, setEngineState] = useState()

 const onSceneReady = useCallback((scene) => {
    const engine = scene.getEngine();
    setSceneState(scene);
    setEngineState(engine);
    console.log('Scene is ready');

    // Caméra temporaire — sera remplacée par CameraController
    const camera = new ArcRotateCamera(
      'transitional-camera',
      Math.PI / 2,
      Math.PI / 2,
      2,
      new Vector3(0, 5, -20),
      scene
    );
    camera.setTarget(Vector3.Zero());
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
  }, []);

  const onRender = useCallback((scene) => {
    // logique de rendu par frame (vide pour l'instant)
  }, []);



  return (
    <SceneComponent
    antialias
    onSceneReady={onSceneReady}
    onEngineReady={onRender}>

      {sceneState && engineState && <Shell scene={sceneState} engine={engineState}/>}

    </SceneComponent>
  );
};

export default App;
