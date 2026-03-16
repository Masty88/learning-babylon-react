import React from 'react';

const GameObjectContext = React.createContext({
  scene: null,
  engine: null,
  beforeLoop: null,
  afterLoop: null,
});

const GameObject = ({ children, scene, engine }) => {
  const beforeLoopRef = React.useRef(null);
  const afterLoopRef = React.useRef(null);

  React.useEffect(() => {
    const beforeLoop = () => {
      if (beforeLoopRef.current) {
        beforeLoopRef.current();
      }
    };

    const afterLoop = () => {
      if (afterLoopRef.current) {
        afterLoopRef.current();
      }
    };

    scene.registerBeforeRender(beforeLoop);
    scene.registerAfterRender(afterLoop);

    return () => {
      scene.unregisterBeforeRender(beforeLoop);
      scene.unregisterAfterRender(afterLoop);
    };
  }, [scene]);

  return (
    <GameObjectContext.Provider
      value={{ scene, engine, beforeLoop: beforeLoopRef, afterLoop: afterLoopRef }}
    >
      {children}
    </GameObjectContext.Provider>
  );
};

export { GameObjectContext, GameObject };