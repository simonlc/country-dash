import * as topojson from 'topojson-client';
import type {
  FeatureCollectionLike,
  WorldData,
  WorldTopologyGeometryCollection,
  WorldTopologyObject,
} from '@/features/game/types';

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await response.json()) as T;
}

function getFirstObject(
  topology: WorldTopologyObject,
): WorldTopologyGeometryCollection {
  const [firstKey] = Object.keys(topology.objects);
  if (!firstKey) {
    throw new Error('Topology object is empty');
  }
  const object = topology.objects[firstKey];
  if (!object) {
    throw new Error('Topology object is missing');
  }
  return object;
}

function toFeatureCollection(topology: WorldTopologyObject): FeatureCollectionLike {
  return topojson.feature(topology, getFirstObject(topology)) as FeatureCollectionLike;
}

export async function loadWorldData(): Promise<WorldData> {
  const [worldTopology, world110mTopology] = await Promise.all([
    loadJson<WorldTopologyObject>('data/world-topo.json'),
    loadJson<WorldTopologyObject>('data/world-topo-110m.json'),
  ]);

  return {
    world: toFeatureCollection(worldTopology),
    world110m: toFeatureCollection(world110mTopology),
  };
}
