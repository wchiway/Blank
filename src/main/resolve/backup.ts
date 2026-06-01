import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getAppConfig } from '../config'
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'
import {
  appConfigPath,
  controledMihomoConfigPath,
  dataDir,
  overrideConfigPath,
  overrideDir,
  profileConfigPath,
  profilesDir,
  subStoreDir,
  themesDir
} from '../utils/dirs'

interface S3BackupConfig {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  prefix: string
  forcePathStyle: boolean
}

function createBackupZip(): AdmZip {
  const zip = new AdmZip()

  zip.addLocalFile(appConfigPath())
  zip.addLocalFile(controledMihomoConfigPath())
  zip.addLocalFile(profileConfigPath())
  zip.addLocalFile(overrideConfigPath())
  zip.addLocalFolder(themesDir(), 'themes')
  zip.addLocalFolder(profilesDir(), 'profiles')
  zip.addLocalFolder(overrideDir(), 'override')
  zip.addLocalFolder(subStoreDir(), 'substore')

  return zip
}

function createBackupFilename(): string {
  const date = new Date()
  return `${process.platform}_${dayjs(date).format('YYYY-MM-DD_HH-mm-ss')}.zip`
}

function restoreBackupZip(zipData: Buffer): void {
  const zip = new AdmZip(zipData)
  zip.extractAllTo(dataDir(), true)
}

function normalizeS3Prefix(prefix: string): string {
  return prefix.replace(/^\/+|\/+$/g, '')
}

function buildS3Key(prefix: string, filename: string): string {
  const normalizedPrefix = normalizeS3Prefix(prefix)
  return normalizedPrefix ? `${normalizedPrefix}/${filename}` : filename
}

async function getS3BackupConfig(): Promise<S3BackupConfig> {
  const {
    s3Endpoint = '',
    s3Region = 'auto',
    s3AccessKeyId = '',
    s3SecretAccessKey = '',
    s3Bucket = '',
    s3Prefix = 'sparkle',
    s3ForcePathStyle = true
  } = await getAppConfig()

  if (!s3Region.trim()) throw new Error('S3/R2 Region 不能为空')
  if (!s3AccessKeyId.trim()) throw new Error('S3/R2 Access Key ID 不能为空')
  if (!s3SecretAccessKey.trim()) throw new Error('S3/R2 Secret Access Key 不能为空')
  if (!s3Bucket.trim()) throw new Error('S3/R2 Bucket 不能为空')

  return {
    endpoint: s3Endpoint.trim(),
    region: s3Region.trim(),
    accessKeyId: s3AccessKeyId.trim(),
    secretAccessKey: s3SecretAccessKey,
    bucket: s3Bucket.trim(),
    prefix: s3Prefix,
    forcePathStyle: s3ForcePathStyle
  }
}

function createS3Client(config: S3BackupConfig): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })
}

async function s3BodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) throw new Error('S3/R2 备份文件为空')

  if (body instanceof Uint8Array) return Buffer.from(body)

  if (typeof body === 'object' && body !== null && 'transformToByteArray' in body) {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray()
    return Buffer.from(bytes)
  }

  const chunks: Buffer[] = []
  for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function webdavBackup(): Promise<boolean> {
  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()
  const zip = createBackupZip()
  const zipFileName = createBackupFilename()

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  try {
    await client.createDirectory(webdavDir)
  } catch {
    // ignore
  }

  return await client.putFileContents(`${webdavDir}/${zipFileName}`, zip.toBuffer())
}

export async function webdavRestore(filename: string): Promise<void> {
  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  const zipData = await client.getFileContents(`${webdavDir}/${filename}`)
  restoreBackupZip(zipData as Buffer)
}

export async function listWebdavBackups(): Promise<string[]> {
  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  const files = await client.getDirectoryContents(webdavDir, { glob: '*.zip' })
  return files.map((file) => file.basename)
}

export async function webdavDelete(filename: string): Promise<void> {
  const { createClient } = await import('webdav/dist/node/index.js')
  const {
    webdavUrl = '',
    webdavUsername = '',
    webdavPassword = '',
    webdavDir = 'sparkle'
  } = await getAppConfig()

  const client = createClient(webdavUrl, {
    username: webdavUsername,
    password: webdavPassword
  })
  await client.deleteFile(`${webdavDir}/${filename}`)
}

export async function s3Backup(): Promise<boolean> {
  const config = await getS3BackupConfig()
  const client = createS3Client(config)
  const filename = createBackupFilename()
  const key = buildS3Key(config.prefix, filename)

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: createBackupZip().toBuffer(),
      ContentType: 'application/zip'
    })
  )

  return true
}

export async function s3Restore(filename: string): Promise<void> {
  const config = await getS3BackupConfig()
  const client = createS3Client(config)
  const key = buildS3Key(config.prefix, filename)
  const result = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))

  restoreBackupZip(await s3BodyToBuffer(result.Body))
}

export async function listS3Backups(): Promise<string[]> {
  const config = await getS3BackupConfig()
  const client = createS3Client(config)
  const prefix = normalizeS3Prefix(config.prefix)
  const listPrefix = prefix ? `${prefix}/` : undefined
  const filenames: string[] = []
  let continuationToken: string | undefined

  do {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: listPrefix,
        ContinuationToken: continuationToken
      })
    )

    for (const object of result.Contents ?? []) {
      if (!object.Key?.endsWith('.zip')) continue
      const filename = object.Key.split('/').pop()
      if (filename) filenames.push(filename)
    }

    continuationToken = result.NextContinuationToken
  } while (continuationToken)

  return filenames
}

export async function s3Delete(filename: string): Promise<void> {
  const config = await getS3BackupConfig()
  const client = createS3Client(config)
  const key = buildS3Key(config.prefix, filename)

  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
}
