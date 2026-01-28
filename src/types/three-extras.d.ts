declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import type {
    AnimationClip,
    Group,
    Loader,
    LoadingManager,
    Object3D,
  } from 'three';

  export interface GLTF {
    scene: Group;
    scenes: Group[];
    animations: AnimationClip[];
    cameras: Object3D[];
    asset: Record<string, unknown>;
  }

  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}
