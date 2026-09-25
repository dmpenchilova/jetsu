import * as migration_20260925_122905_initial from './20260925_122905_initial';
import * as migration_20260925_140834_collections from './20260925_140834_collections';
import * as migration_20260925_164248_events_offices from './20260925_164248_events_offices';

export const migrations = [
  {
    up: migration_20260925_122905_initial.up,
    down: migration_20260925_122905_initial.down,
    name: '20260925_122905_initial',
  },
  {
    up: migration_20260925_140834_collections.up,
    down: migration_20260925_140834_collections.down,
    name: '20260925_140834_collections',
  },
  {
    up: migration_20260925_164248_events_offices.up,
    down: migration_20260925_164248_events_offices.down,
    name: '20260925_164248_events_offices',
  },
];
