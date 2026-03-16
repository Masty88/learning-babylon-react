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