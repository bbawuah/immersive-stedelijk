/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { EnvironmentProps } from './types/types';
import { HopePaintings } from './HopePaintings';
import { JusticePaintings } from './JusticePaintings';
import { LovePaintings } from './LovePaintings';
import { Water } from 'three-stdlib';
import {
  extend,
  ReactThreeFiber,
  useFrame,
  useLoader,
  useThree,
} from '@react-three/fiber';
import { VideoScreen } from './VideoScreen';

extend({ Water });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      water: ReactThreeFiber.Object3DNode<Water, typeof Water>;
    }
  }
}

export const Environment: React.FC<EnvironmentProps> = (props) => {
  const { nodes } = props;
  const group = useRef<THREE.Group>();
  const waterRef = useRef<THREE.Mesh>();
  const waterNormals = useLoader(
    THREE.TextureLoader,
    '/textures/waternormals.jpg'
  );
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), []);

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 1.2,
      fog: false,
    }),
    [waterNormals]
  );
  const metalnessMap = useTexture('/metallic-texture.jpg');
  const normalTexture = useTexture('/normal-texture.jpg');
  normalTexture.flipY = false;
  metalnessMap.flipY = false;
  normalTexture.minFilter = THREE.LinearFilter;
  metalnessMap.minFilter = THREE.LinearFilter;

  const color = 0x8b7967;
  const material = new THREE.MeshPhongMaterial({
    color,
    normalMap: normalTexture,
    specular: 0x00fff0,
    shininess: 25,
    specularMap: metalnessMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
  });
  const materialTwo = new THREE.MeshPhongMaterial({
    color: 0x34312b,
    specular: 0xbfab8e,
    shininess: 15,
    specularMap: metalnessMap,
  });

  useFrame((state, delta) => {
    if (waterRef.current) {
      (waterRef.current.material as THREE.ShaderMaterial).uniforms.time.value +=
        delta * 0.25;
    }
  });

  return (
    <group ref={group} dispose={null} position={new THREE.Vector3(0, 0.5, 0)}>
      <mesh
        geometry={nodes.screen001.geometry}
        material={nodes.screen001.material}
      />
      <mesh geometry={nodes.environment.geometry} material={material} />
      <VideoScreen nodes={nodes} material={material} />
      <HopePaintings nodes={nodes} material={material} />
      <LovePaintings nodes={nodes} material={material} />
      <JusticePaintings nodes={nodes} material={material} />
      <mesh geometry={nodes.navmesh.geometry} material={material} />
      <mesh geometry={nodes.mountains.geometry} material={materialTwo} />
      <water
        ref={waterRef}
        args={[geom, config]}
        rotation-x={-Math.PI / 2}
        position={new THREE.Vector3(0, -0.5, 0)}
      />
    </group>
  );
};

useGLTF.preload('/environment-transformed.glb');
