import {
  Engine,
  Scene,
} from '@babylonjs/core'
import React, { useEffect, useRef } from 'react'
export const SceneComponent = (props) => {
  const reactCanvas = useRef(null)
  const {
    canvasId,
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onRender,
    onSceneReady,
    ...rest
  } = props
  useEffect(() => {
    if (!reactCanvas.current) return
    const engine = new Engine(
      reactCanvas.current,
      antialias,
      engineOptions,
      adaptToDeviceRatio
    )
    const scene = new Scene(engine, sceneOptions)
    if (scene.isReady()) {
      onSceneReady(scene)
    } else {
      scene.onReadyObservable.addOnce(onSceneReady)
    }
    engine.runRenderLoop(() => {
      scene.render()
    })
    const resize = () => {
      scene.getEngine().resize()
    }
    if (window) {
      window.addEventListener('resize', resize)
    }
    return () => {
      scene.getEngine().dispose()
      if (window) {
        window.removeEventListener('resize', resize)
      }
    }
  }, [
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onSceneReady,
  ])
  return <canvas id={canvasId} ref={reactCanvas} {...rest} />
}