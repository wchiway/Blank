import React, { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Switch } from '@heroui/react'
import { listS3Backups, s3Backup } from '@renderer/utils/ipc'
import S3RestoreModal from './s3-restore-modal'
import debounce from '@renderer/utils/debounce'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { notify } from '@renderer/utils/notification'

const S3Config: React.FC = () => {
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    s3Endpoint = '',
    s3Region = 'auto',
    s3AccessKeyId = '',
    s3SecretAccessKey = '',
    s3Bucket = '',
    s3Prefix = 'blank',
    s3ForcePathStyle = true
  } = appConfig || {}
  const [backuping, setBackuping] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [filenames, setFilenames] = useState<string[]>([])
  const [restoreOpen, setRestoreOpen] = useState(false)

  const [s3, setS3] = useState({
    s3Endpoint,
    s3Region,
    s3AccessKeyId,
    s3SecretAccessKey,
    s3Bucket,
    s3Prefix,
    s3ForcePathStyle
  })
  const setS3Debounce = debounce(
    ({
      s3Endpoint,
      s3Region,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Bucket,
      s3Prefix,
      s3ForcePathStyle
    }) => {
      patchAppConfig({
        s3Endpoint,
        s3Region,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3Bucket,
        s3Prefix,
        s3ForcePathStyle
      })
    },
    500
  )
  const updateS3 = (patch: Partial<typeof s3>): void => {
    const nextS3 = { ...s3, ...patch }
    setS3(nextS3)
    setS3Debounce(nextS3)
  }
  const handleBackup = async (): Promise<void> => {
    setBackuping(true)
    try {
      await s3Backup()
      notify('备份成功', { body: '备份文件已上传至 S3/R2', variant: 'success' })
    } catch (e) {
      notify(e, { variant: 'danger' })
    } finally {
      setBackuping(false)
    }
  }

  const handleRestore = async (): Promise<void> => {
    try {
      setRestoring(true)
      const filenames = await listS3Backups()
      setFilenames(filenames)
      setRestoreOpen(true)
    } catch (e) {
      notify(`获取备份列表失败：${e}`, { variant: 'danger' })
    } finally {
      setRestoring(false)
    }
  }
  return (
    <>
      {restoreOpen && <S3RestoreModal filenames={filenames} onClose={() => setRestoreOpen(false)} />}
      <SettingCard header="S3/R2 备份">
        <SettingItem compatKey="legacy" title="Endpoint" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={s3.s3Endpoint}
            placeholder="R2/MinIO 需要填写，AWS S3 可留空"
            onValueChange={(v) => updateS3({ s3Endpoint: v })}
          />
        </SettingItem>
        <SettingItem compatKey="legacy" title="Region" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={s3.s3Region}
            placeholder="auto"
            onValueChange={(v) => updateS3({ s3Region: v })}
          />
        </SettingItem>
        <SettingItem compatKey="legacy" title="Bucket" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={s3.s3Bucket}
            onValueChange={(v) => updateS3({ s3Bucket: v })}
          />
        </SettingItem>
        <SettingItem compatKey="legacy" title="备份目录" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={s3.s3Prefix}
            placeholder="blank"
            onValueChange={(v) => updateS3({ s3Prefix: v })}
          />
        </SettingItem>
        <SettingItem compatKey="legacy" title="Access Key ID" divider>
          <Input
            size="sm"
            className="w-[60%]"
            value={s3.s3AccessKeyId}
            onValueChange={(v) => updateS3({ s3AccessKeyId: v })}
          />
        </SettingItem>
        <SettingItem compatKey="legacy" title="Secret Access Key" divider>
          <Input
            size="sm"
            className="w-[60%]"
            type="password"
            value={s3.s3SecretAccessKey}
            onValueChange={(v) => updateS3({ s3SecretAccessKey: v })}
          />
        </SettingItem>
        <SettingItem compatKey="legacy" title="强制路径样式" divider>
          <Switch
            size="sm"
            isSelected={s3.s3ForcePathStyle}
            onValueChange={(v) => updateS3({ s3ForcePathStyle: v })}
          />
        </SettingItem>
        <div className="flex justify0between">
          <Button isLoading={backuping} fullWidth size="sm" className="mr-1" onPress={handleBackup}>
            备份
          </Button>
          <Button
            isLoading={restoring}
            fullWidth
            size="sm"
            className="ml-1"
            onPress={handleRestore}
          >
            恢复
          </Button>
        </div>
      </SettingCard>
    </>
  )
}

export default S3Config
