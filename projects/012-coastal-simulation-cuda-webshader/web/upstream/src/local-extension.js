// 012 local extension: add one rock to the shared coast definition before
// the upstream GPU buffers and Three.js world are constructed.
import { ROCKS, terrainHeight } from './coast.js?v=1.5.1';

export function installRockExtension(search) {
  if (new URLSearchParams(search).get('reef') !== '1') return false;
  const rock = {
    x: 15.7, z: -36.4, rx: 2.1, rz: 1.6, h: 2.9,
    rot: -0.35, seed: 113
  };
  rock.base = terrainHeight(rock.x, rock.z) - .28;
  rock.c = Math.cos(rock.rot);
  rock.s = Math.sin(rock.rot);
  ROCKS.push(rock);
  return true;
}
