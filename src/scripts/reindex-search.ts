/** Полная пересборка индекса поиска: npm run search:reindex */
import config from '@payload-config'
import { getPayload } from 'payload'

import { reindexAll } from '../lib/search/indexer'

const payload = await getPayload({ config })
const n = await reindexAll(payload)
payload.logger.info(`Индекс поиска пересобран: ${n} документов`)
process.exit(0)
