import * as migration_20260925_122905_initial from './20260925_122905_initial';
import * as migration_20260925_140834_collections from './20260925_140834_collections';

export const migrations = [
  {
    up: migration_20260925_122905_initial.up,
    down: migration_20260925_122905_initial.down,
    name: '20260925_122905_initial',
  },
  {
    up: migration_20260925_140834_collections.up,
    down: migration_20260925_140834_collections.down,
    name: '20260925_140834_collections'
  },
];
