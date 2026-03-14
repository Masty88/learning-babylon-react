# Cours Babylon.js + React — Plan de cours

> **Point de départ :** repo Vite + React avec `node_modules` déjà installé.
> Les fichiers `index.html` et `src/main.jsx` existent déjà (template Vite de base).
> On va créer tous les autres fichiers ensemble, étape par étape.

---

## INTRODUCTION — Architecture et concepts clés

> **🇫🇷 À expliquer :**
> "Avant d'écrire la moindre ligne de code, on doit comprendre ce qu'on va construire
> et comment les deux technologies vont collaborer. React et Babylon.js ont des rôles
> très différents — les confondre, c'est la source de tous les bugs de ce type de projet."

### Deux mondes qui coexistent

```
┌─────────────────────────────────────────────────────┐
│                     REACT                           │
│  Gère la structure, l'état, le cycle de vie         │
│  des composants. Ne dessine RIEN en 3D.             │
│                                                     │
│   App → Shell → [Controller, Controller, ...]       │
└────────────────────┬────────────────────────────────┘
                     │ passe scene/engine via Context
┌────────────────────▼────────────────────────────────┐
│                   BABYLON.JS                        │
│  Gère le rendu 3D, la physique, les caméras,        │
│  les meshes, la boucle de rendu (60fps).            │
│                                                     │
│   Engine → Scene → [Mesh, Camera, Light, ...]       │
└─────────────────────────────────────────────────────┘
```

**Règle d'or :** React monte/démonte des composants une seule fois.
Babylon tourne à 60fps dans sa propre boucle.
Les `useEffect` sont le pont entre les deux.

---

### Architecture des composants

```
index.html
  └── main.jsx  (point d'entrée React)
        └── App.jsx  (état : scene, engine)
              ├── SceneComponent  ── crée Engine + Scene, lance la boucle de rendu
              └── Shell  ── orchestre tous les systèmes du jeu
                    └── GameObject  ── Context Provider (partage scene/engine)
                          ├── EnvironmentController  ── sol + lumière (une fois)
                          ├── PlayerController  ── mesh joueur + physique (par frame)
                          ├── CameraController  ── caméra de suivi (conditionnelle)
                          └── InputController  ── clavier → valeurs normalisées
```

**Flux de données (unidirectionnel) :**
```
Clavier
  ↓
InputController  →  onInputUpdated()
                          ↓
                     Shell (state: input)
                          ↓
                    PlayerController  →  moveWithCollisions()
                          ↓
                     onPlayerCreated()
                          ↓
                     Shell (state: playerMesh)
                          ↓
                    CameraController  →  lockedTarget = playerMesh
```

---

### Pattern de communication entre composants

> **🇫🇷 À expliquer :**
> "Dans ce projet on utilise 3 façons de faire communiquer les composants.
> Les reconnaître, c'est comprendre toute l'architecture."

---

#### Pattern 1 — Props descendantes *(parent → enfant)*

Le parent passe des données à l'enfant via les attributs JSX.
C'est le flux normal de React.

```
App  ──(scene, engine)──▶  Shell
Shell  ──(input)──────────▶  PlayerController
Shell  ──(playerMesh)─────▶  CameraController
```

---

#### Pattern 2 — Callback props *(enfant → parent)*

Le parent passe une **fonction** à l'enfant.
L'enfant l'appelle quand un événement se produit.
C'est le seul moyen légal pour un enfant de parler à son parent en React.

```
Shell  ──(onPlayerCreated)──▶  PlayerController
                                      │
                                      │ appelle onPlayerCreated(mesh)
                                      ▼
                               Shell met à jour playerMesh
                               → CameraController s'active

Shell  ──(onInputUpdated)───▶  InputController
                                      │
                                      │ appelle onInputUpdated({h, v, jump})
                                      ▼
                               Shell met à jour input
                               → PlayerController reçoit les nouvelles valeurs
```

---

#### Pattern 3 — Context *(broadcast à tous les descendants)*

Un composant "fournisseur" (`Provider`) publie des valeurs.
N'importe quel descendant peut les lire avec `useContext`, sans passer par les props intermédiaires.

```
GameObject (Provider)  ──── publie { scene, engine }
      │
      ├── EnvironmentController  ──  useContext → scene ✅
      ├── PlayerController       ──  useContext → scene ✅
      ├── CameraController       ──  useContext → scene, engine ✅
      └── InputController        ──  useContext → scene ✅
```

> **Règle d'usage :** Props pour les données spécifiques à un composant.
> Context pour les données globales partagées par toute l'app (scene, engine, user, theme...).

---

## ÉTAPE 1 — Le canvas Babylon.js : SceneComponent + App.css

> **🇫🇷 À expliquer :**
> "Babylon.js a besoin d'un élément `<canvas>` HTML pour dessiner en 3D.
> On va créer un composant React qui encapsule le moteur Babylon.js et la scène.
> Ce composant va créer le moteur (Engine), créer la scène (Scene), lancer la boucle de rendu,
> et gérer le redimensionnement de la fenêtre. Il va nous exposer deux callbacks :
> `onSceneReady` (quand la scène est prête) et `onRender` (à chaque frame).
> C'est le seul fichier qui touche directement au DOM — tout le reste passe par Babylon."

### `src/App.css`

```css
* {
  margin: 0;
  padding: 0;
}

#root {
  max-width: 100%;
  margin: 0 auto;
}

canvas {
  display: block;
  margin: 0 auto;
  width: 100%;
  height: 100vh;
}
```

> **🪝 Hooks introduits ici pour la première fois : `useRef` et `useEffect`**
>
> **`useRef`** — une boîte qui stocke une valeur **sans déclencher de re-render**.
> On l'utilise ici pour garder une référence au `<canvas>` DOM réel.
> ```js
> const reactCanvas = useRef(null)
> // reactCanvas.current → l'élément <canvas> dans le DOM
> ```
>
> **`useEffect`** — exécute du code **après** que React a rendu le composant.
> Sert à tout ce qui touche le monde extérieur (DOM, timers, librairies comme Babylon).
> La fonction `return` est le **cleanup** : s'exécute au démontage du composant.
> ```js
> useEffect(() => {
>   // side effect ici (créer engine, ajouter listener...)
>   return () => { /* cleanup : dispose engine, remove listener */ }
> }, [dep1, dep2])  // ← ne se réexécute que si dep1 ou dep2 change
> ```
> | Tableau de dépendances | Quand l'effet s'exécute |
> |------------------------|------------------------|
> | `[]` | Une seule fois après le premier rendu |
> | `[scene]` | À chaque changement de `scene` |
> | `[scene, input]` | À chaque changement de `scene` ou `input` |
>
> ⚠️ **Piège :** oublier le cleanup → les listeners s'accumulent à chaque render → bugs.

### `src/components/SceneComponent.jsx`

```jsx
import { Engine, Scene } from '@babylonjs/core'
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
      onRender(scene)
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
  }, [antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady])

  return <canvas id={canvasId} ref={reactCanvas} {...rest} />
}
```

> **Résultat :** pas encore visible — le composant existe mais n'est pas encore utilisé.

---

## ÉTAPE 2 — App.jsx : monter la scène

> **🪝 Hooks introduits ici pour la première fois : `useState` et `useCallback`**
>
> **`useState`** — stocke une valeur dans le composant. Quand elle change → React re-rend.
> ```js
> const [scene, setScene] = useState(null)
> // scene = null au départ
> // setScene(s) → React re-rend App → Shell reçoit la vraie scène
> ```
>
> **`useCallback`** — mémorise une fonction pour ne pas la recréer à chaque render.
> ```js
> const onSceneReady = useCallback((scene) => { ... }, [])
> ```
> Pourquoi c'est critique ici : `onSceneReady` est passée en prop à `SceneComponent`.
> `SceneComponent` a un `useEffect([..., onSceneReady])` — si la fonction change à chaque render,
> l'effet se réexécute → l'Engine Babylon est recréé → **boucle infinie**.
> `useCallback(fn, [])` garantit que c'est toujours la même référence.

> **🇫🇷 À expliquer :**
> "Maintenant on utilise notre `SceneComponent` dans `App.jsx`.
> On va stocker la scène et le moteur dans le state React — comme ça, les composants enfants
> pourront les utiliser dès qu'ils sont prêts.
> Pour l'instant on ajoute une caméra temporaire `ArcRotateCamera` juste pour pouvoir
> voir quelque chose — on la remplacera plus tard par une vraie caméra de suivi.
> Le concept clé ici : `useCallback` pour que les fonctions ne soient pas recréées à chaque render,
> ce qui éviterait de redémarrer le moteur Babylon en boucle."

### `src/App.jsx`

```jsx
import React, { useState, useCallback } from 'react';
import { SceneComponent } from './components/SceneComponent';
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { Shell } from './components/Shell';
import './App.css';

const App = () => {
  const [sceneState, setSceneState] = useState(null);
  const [engineState, setEngineState] = useState(null);

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
      onRender={onRender}
      id="my-canvas"
    >
      {sceneState && engineState && (
        <Shell scene={sceneState} engine={engineState} />
      )}
    </SceneComponent>
  );
};

export default App;
```

> **⚠️ Note :** l'app va crasher car `Shell` n'existe pas encore.
> On va le créer tout de suite.

---

## ÉTAPE 3 — GameObjectContext : partager la scène entre les composants

> **🇫🇷 À expliquer :**
> "On a un problème classique en React : comment partager la scène Babylon entre plusieurs composants
> sans passer des props à chaque niveau ?
> La réponse : le Context API de React.
> On crée un contexte `GameObjectContext` qui contient la scène et le moteur.
> On crée aussi un composant `GameObject` qui enregistre des callbacks `beforeRender` et `afterRender`
> sur la scène Babylon — comme ça, n'importe quel composant enfant peut exécuter du code
> à chaque frame sans recréer ses propres listeners.
> C'est le pattern 'game loop dans React'."

### `src/contexts/GameObjectContext.jsx`

```jsx
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
```

---

## ÉTAPE 4 — Shell : l'orchestrateur

> **🇫🇷 À expliquer :**
> "Shell est le chef d'orchestre de notre jeu.
> Il reçoit la scène et le moteur depuis App, les passe au contexte via GameObject,
> et monte tous les contrôleurs dans le bon ordre.
> Pour l'instant on crée une version minimale — on ajoutera les contrôleurs au fur et à mesure.
> Il gère aussi deux états importants :
> - `playerMesh` : la référence au mesh du joueur (nécessaire pour la caméra)
> - `input` : les valeurs de clavier (nécessaire pour le mouvement du joueur)"

### `src/components/Shell.jsx` *(version minimale)*

```jsx
import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';

export const Shell = ({ scene, engine }) => {
  return (
    <GameObject scene={scene} engine={engine}>
      {/* on ajoutera les contrôleurs ici */}
    </GameObject>
  );
};
```

> **Résultat :** ✅ écran noir — l'app tourne, pas d'erreur, Babylon est initialisé.

---

## ÉTAPE 5 — EnvironmentController : le sol et la lumière

> **🪝 Hook introduit ici pour la première fois : `useContext`**
>
> **`useContext`** — lit les valeurs publiées par le `Provider` le plus proche dans l'arbre.
> Sans lui, on devrait passer `scene` en prop à chaque composant (prop drilling).
> ```js
> // ❌ sans Context : pénible
> <EnvironmentController scene={scene} />
>
> // ✅ avec Context : scene disponible partout automatiquement
> const { scene } = useContext(GameObjectContext)
> ```
> N'importe quel descendant de `<GameObject>` peut l'utiliser — sans aucune prop supplémentaire.

> **🇫🇷 À expliquer :**
> "Maintenant on va créer notre premier composant 3D visible !
> `EnvironmentController` crée le sol (un plan 100x100) et une lumière hémisphérique.
> Le `useContext(GameObjectContext)` nous donne accès à la scène sans prop drilling.
> Le `useEffect` avec `[scene]` s'exécute une seule fois quand la scène est disponible.
> Important : `checkCollisions = true` sur le sol — le joueur ne tombera pas à travers.
> Ce composant retourne `null` — pas de rendu React, seulement des effets Babylon."

### `src/components/EnvironnementController.jsx`

```jsx
import React, { useEffect, useContext } from 'react';
import { MeshBuilder, HemisphericLight, Vector3, Color3, StandardMaterial } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';

export const EnvironmentController = () => {
  const { scene } = useContext(GameObjectContext);

  useEffect(() => {
    if (!scene) return;

    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    ground.checkCollisions = true;

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  }, [scene]);

  return null;
}
```

### Mettre à jour `Shell.jsx`

```jsx
import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
import { EnvironmentController } from './EnvironnementController';

export const Shell = ({ scene, engine }) => {
  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
    </GameObject>
  );
};
```

> **Résultat :** ✅ un sol gris et une lumière — le monde existe !

---

## ÉTAPE 6 — Les constantes du jeu

> **🇫🇷 À expliquer :**
> "Bonne pratique : on sort toutes les valeurs 'magiques' dans un fichier de constantes.
> Comme ça on peut tweaker la physique facilement sans chercher dans le code.
> La gravité, la vitesse, la force de saut — ce sont des paramètres de game design,
> pas de la logique, donc ils méritent leur propre fichier."

### `src/settings/const.js`

```js
export const GRAVITY = -5.81;          // accélération de gravité en m/s²
export const PLAYER_SPEED = 1.6;       // vitesse du joueur en unités/s
export const ROTATION_SPEED = 0.05;    // vitesse de rotation en rad/frame
export const PLAYER_JUMP_FORCE = 0.5;  // force de saut en m/s²
```

---

## ÉTAPE 7 — PlayerController : le joueur

> **🪝 `useRef` — second usage : stocker des données haute fréquence (60fps)**
>
> On a déjà vu `useRef` pour pointer vers un élément DOM.
> Ici on l'utilise pour une raison différente : stocker des valeurs qui changent
> **à chaque frame** (60 fois/seconde) sans déclencher de re-render React.
> ```js
> const playerRef = useRef(null)            // le mesh Babylon → lu à 60fps
> const velocityRef = useRef(new Vector3()) // vecteur vitesse → modifié à 60fps
>
> // Modifier velocityRef.current n'entraîne AUCUN re-render
> // → parfait pour la physique (gravité, saut)
> ```
> **Règle :** données qui changent souvent ET dont l'UI n'a pas besoin → `useRef`.
> Données dont le changement doit mettre à jour l'affichage → `useState`.

> **🇫🇷 À expliquer :**
> "Le joueur est une sphère Babylon.js créée dans un `useEffect`.
> Deux `useEffect` séparés — c'est important :
> - Le premier crée le mesh une seule fois (dépendance `[scene]`)
> - Le second gère le mouvement et se recrée à chaque changement d'input (dépendance `[scene, input]`)
>
> Pour le mouvement : on calcule un vecteur 'avant' basé sur la rotation Y du joueur,
> puis on le scale par la vitesse — c'est la mécanique de base de tout jeu 3D.
> Pour la gravité : on accumule une vélocité Y négative à chaque frame avec Lerp pour lisser.
> `moveWithCollisions` au lieu de modifier `position` directement — c'est Babylon qui gère
> les collisions avec le sol et les autres objets.
> On appelle `onPlayerCreated` pour informer Shell que le mesh est prêt — Shell pourra
> alors activer la caméra de suivi."

### `src/components/PlayerController.jsx`

```jsx
import React, { useEffect, useRef, useContext, useState } from 'react';
import { MeshBuilder, TransformNode, StandardMaterial, Vector3, Scalar, Color3 } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, ROTATION_SPEED } from '../settings/const';

export const PlayerController = ({ input, onPlayerCreated }) => {
  const { scene } = useContext(GameObjectContext);
  const [isFalling, setIsFalling] = useState(false);
  const playerRef = useRef(null);
  const velocityRef = useRef(new Vector3(0, 0, 0));

  // EFFET 1 : création du mesh (une seule fois)
  useEffect(() => {
    const player = MeshBuilder.CreateSphere("player", { diameter: 2 }, scene);
    player.position = new Vector3(0, 500, 0);

    const playerMaterial = new StandardMaterial("playerMaterial", scene);
    playerMaterial.diffuseColor = new Color3(0, 0, 10);
    player.material = playerMaterial;

    player.checkCollisions = true;

    // TransformNode enfant pour indiquer la direction du joueur
    const node = new TransformNode("playerNode", scene);
    node.parent = player;
    node.position = new Vector3(0, 0, 1);

    const square = MeshBuilder.CreateBox("square", { size: 0.5 }, scene);
    square.parent = node;

    playerRef.current = player;

    if (onPlayerCreated) {
      onPlayerCreated(player);
    }
  }, [scene]);

  // EFFET 2 : mouvement (se met à jour quand input change)
  useEffect(() => {
    if (!scene || !playerRef.current) return;

    const updatePlayerMovement = () => {
      const { horizontal, vertical, jump } = input || { horizontal: 0, vertical: 0 };

      // Rotation gauche/droite
      if (horizontal !== 0) {
        playerRef.current.rotation.y += horizontal * ROTATION_SPEED;
      }

      // Mouvement avant/arrière
      if (vertical !== 0) {
        const frontVector = new Vector3(
          Math.sin(playerRef.current.rotation.y),
          0,
          Math.cos(playerRef.current.rotation.y)
        );
        const moveDirection = frontVector.scale(vertical * PLAYER_SPEED);
        playerRef.current.position.addInPlace(moveDirection);
      }

      // Détection de chute
      if (playerRef.current.position.y < 0) {
        setIsFalling(true);
      }

      // Saut
      if (jump && playerRef.current.position.y < 1.2 && !isFalling) {
        velocityRef.current.y = PLAYER_JUMP_FORCE;
      }

      // Gravité avec Lerp
      const deltaTime = scene.getEngine().getDeltaTime() / 1000;
      const newVelocityY = velocityRef.current.y + GRAVITY * deltaTime;
      velocityRef.current.y = Scalar.Lerp(velocityRef.current.y, newVelocityY, 0.1);

      // Déplacement avec collisions
      playerRef.current.moveWithCollisions(velocityRef.current);
    };

    scene.registerBeforeRender(updatePlayerMovement);
    return () => {
      scene.unregisterBeforeRender(updatePlayerMovement);
    };
  }, [scene, input]);

  return null;
}
```

### Mettre à jour `Shell.jsx`

```jsx
import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
import { EnvironmentController } from './EnvironnementController';
import { PlayerController } from './PlayerController';

export const Shell = ({ scene, engine }) => {
  const [playerMesh, setPlayerMesh] = useState(null);
  const [input, setInput] = useState({ horizontal: 0, vertical: 0 });

  const onPlayerCreated = (playerMesh) => {
    setPlayerMesh(playerMesh);
  };

  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
      <PlayerController input={input} onPlayerCreated={onPlayerCreated} />
    </GameObject>
  );
};
```

> **Résultat :** ✅ une sphère bleue tombe du ciel et atterrit sur le sol.
> On ne peut pas encore la contrôler — ça vient dans les prochaines étapes.

---

## ÉTAPE 8 — CameraController : la caméra de suivi

> **🇫🇷 À expliquer :**
> "On va remplacer la `ArcRotateCamera` temporaire par une `FollowCamera`.
> Une `FollowCamera` suit automatiquement un mesh cible — parfait pour un jeu de plateforme.
> Les paramètres importants : `radius` (distance), `heightOffset` (hauteur), `rotationOffset` (angle).
> On commence par supprimer l'ancienne caméra par son nom — c'est pour ça qu'on l'avait nommée
> `transitional-camera` dans App.jsx !
> Ce composant ne s'active que quand `playerMesh` existe (voir Shell) —
> on ne peut pas suivre quelque chose qui n'existe pas encore."

### `src/components/CameraController.jsx`

```jsx
import { useContext, useEffect } from 'react';
import { FollowCamera, Vector3 } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';

export const CameraController = ({ playerMesh }) => {
  const { scene, engine } = useContext(GameObjectContext);

  useEffect(() => {
    if (!scene || !playerMesh) return;

    // Supprimer la caméra temporaire
    const existingCamera = scene.getCameraByName("transitional-camera");
    if (existingCamera) {
      existingCamera.dispose();
    }

    // Créer la caméra de suivi
    const camera = new FollowCamera("main-camera", new Vector3(0, 5, -50), scene);
    camera.radius = 40;           // distance du joueur
    camera.heightOffset = 5;      // hauteur au-dessus du joueur
    camera.rotationOffset = 180;  // derrière le joueur
    camera.cameraAcceleration = 0.5;

    camera.lockedTarget = playerMesh;
    scene.activeCamera = camera;
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

    return () => {
      camera.dispose();
    };
  }, [scene, playerMesh]);

  return null;
}
```

### Mettre à jour `Shell.jsx`

```jsx
import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
import { EnvironmentController } from './EnvironnementController';
import { PlayerController } from './PlayerController';
import { CameraController } from './CameraController';

export const Shell = ({ scene, engine }) => {
  const [playerMesh, setPlayerMesh] = useState(null);
  const [input, setInput] = useState({ horizontal: 0, vertical: 0 });

  const onPlayerCreated = (playerMesh) => {
    setPlayerMesh(playerMesh);
  };

  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
      <PlayerController input={input} onPlayerCreated={onPlayerCreated} />
      {playerMesh && <CameraController playerMesh={playerMesh} />}
    </GameObject>
  );
};
```

> **Résultat :** ✅ la caméra suit la sphère qui tombe — mais on ne bouge toujours pas.

---

## ÉTAPE 9 — InputController : le clavier

> **🇫🇷 À expliquer :**
> "Dernière pièce du puzzle : capter les touches du clavier et les transformer en valeurs de jeu.
> Deux `useEffect` séparés ici aussi :
> - Le premier écoute les événements DOM `keydown`/`keyup` et stocke l'état de chaque touche.
> - Le second, enregistré dans `beforeRender`, lit l'état des touches à chaque frame
>   et produit des valeurs `-1 / 0 / +1` pour horizontal et vertical.
>
> Pourquoi `Scalar.Lerp(0, 1, 0.8)` ? C'est un moyen simple d'avoir une valeur fixe (ici 0.8 ou 0.3)
> sans hard-coder — on pourrait le remplacer par une accélération progressive.
> Ces valeurs sont passées à `onInputUpdated` → Shell → PlayerController.
> Touches supportées : flèches directionnelles et WASD + Espace pour sauter."

### `src/components/InputController.jsx`

```jsx
import React, { useEffect, useState, useContext } from 'react';
import { Scalar } from '@babylonjs/core';
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
```

---

## ÉTAPE 10 — Shell final : tout connecter

> **🇫🇷 À expliquer :**
> "Dernière étape : on connecte l'InputController au Shell.
> Le flux de données est maintenant complet :
> Clavier → InputController → `onInputUpdated` → state `input` dans Shell → PlayerController
> C'est le pattern unidirectionnel de React appliqué à un jeu 3D.
> On remarque que Shell ne contient presque pas de logique — il orchestre.
> Chaque contrôleur a une responsabilité unique (Single Responsibility Principle)."

### `src/components/Shell.jsx` *(version finale)*

```jsx
import React, { useState } from 'react';
import { GameObject } from '../contexts/GameObjectContext';
import { CameraController } from './CameraController';
import { EnvironmentController } from './EnvironnementController';
import { PlayerController } from './PlayerController';
import { InputController } from './InputController';

export const Shell = ({ scene, engine }) => {
  const [playerMesh, setPlayerMesh] = useState(null);
  const [input, setInput] = useState({
    horizontal: 0,
    vertical: 0,
  });

  const onInputUpdated = (values) => {
    setInput(values);
  };

  const onPlayerCreated = (playerMesh) => {
    setPlayerMesh(playerMesh);
  };

  return (
    <GameObject scene={scene} engine={engine}>
      <EnvironmentController />
      <PlayerController input={input} onPlayerCreated={onPlayerCreated} />
      {playerMesh && <CameraController playerMesh={playerMesh} />}
      <InputController onInputUpdated={onInputUpdated} />
    </GameObject>
  );
};
```

> **Résultat final :** ✅ jeu complet !
> - Flèches / WASD pour se déplacer
> - Espace pour sauter
> - La caméra suit le joueur

---

## Récapitulatif — Flux de données

```
index.html
  └── main.jsx
        └── App.jsx
              ├── SceneComponent  ──── crée Engine + Scene (Babylon)
              └── Shell  ──── orchestre tout
                    └── GameObject  ──── fournit scene/engine via Context
                          ├── EnvironmentController  ──── sol + lumière
                          ├── PlayerController  ──── mesh + physique
                          ├── CameraController  ──── caméra de suivi
                          └── InputController  ──── clavier → input → Shell → Player
```

## Fichiers créés dans l'ordre

| # | Fichier | Ce que ça fait |
|---|---------|----------------|
| 1 | `src/App.css` | Canvas plein écran |
| 2 | `src/components/SceneComponent.jsx` | Wrapper Babylon Engine+Scene |
| 3 | `src/App.jsx` | Monte la scène, caméra temporaire |
| 4 | `src/contexts/GameObjectContext.jsx` | Context partagé (scene, engine) |
| 5 | `src/components/Shell.jsx` | Orchestrateur (versions progressives) |
| 6 | `src/components/EnvironnementController.jsx` | Sol + lumière |
| 7 | `src/settings/const.js` | Constantes physique |
| 8 | `src/components/PlayerController.jsx` | Joueur + mouvement + gravité |
| 9 | `src/components/CameraController.jsx` | Caméra de suivi |
| 10 | `src/components/InputController.jsx` | Clavier |
| 11 | `src/components/Shell.jsx` (final) | Tout connecté |
