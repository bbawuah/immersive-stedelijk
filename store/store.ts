import React from 'react';
import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import shallow from 'zustand/shallow';
import type { GetState, SetState, StateSelector } from 'zustand';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import { Camera } from 'three';

const controls = {
  backward: false,
  forward: false,
  left: false,
  right: false,
};

export type IPlayers = Record<
  string,
  {
    x: number;
    y: number;
    z: number;
  }
>;

const clients = {};

const test = false;

let collider: THREE.Mesh;

const players: IPlayers = {};

// export const cameras = ['DEFAULT', 'FIRST_PERSON', 'BIRD_EYE'] as const;
// export type Camera = typeof cameras[number];

export type Controls = typeof controls;

const actionNames = ['idle', 'walking'] as const;
export type ActionNames = typeof actionNames[number];

interface ICoordinates {
  position: [x: number, y: number, z: number];
  rotation: [x: number, y: number, z: number];
}

export interface IState {
  actions: Record<ActionNames, (camera: Camera) => void>;
  controls: Controls;
  test: boolean;
  players: IPlayers;
  collider: THREE.Mesh;
  get: Getter;
  set: Setter;
}

type Getter = GetState<IState>;
export type Setter = SetState<IState>;

const useStoreImplementation = create(
  subscribeWithSelector<IState>(
    (set: SetState<IState>, get: GetState<IState>) => {
      const actions = {
        walking: () => {},
        idle: () => {},
      };

      return {
        actions,
        controls,
        clients,
        test,
        players,
        collider,
        get,
        set,
      };
    }
  )
);

const useStore = <T>(sel: StateSelector<IState, T>) =>
  useStoreImplementation(sel, shallow);
Object.assign(useStore, useStoreImplementation);

const { getState, setState, subscribe } = useStoreImplementation;

export { getState, setState, useStore, subscribe };
