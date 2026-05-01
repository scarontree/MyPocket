export const BACKUP_VERSION = 2

export function createBackup(ledgerStore, settingsStore) {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ledger: JSON.parse(ledgerStore.exportData()),
    settings: settingsStore.exportData(),
  }
}

export function restoreBackup(backup, ledgerStore, settingsStore) {
  if (backup?.ledger !== undefined || backup?.settings !== undefined) {
    if (backup.ledger !== undefined) ledgerStore.importData(backup.ledger)
    if (backup.settings !== undefined) settingsStore.importData(backup.settings)
    return 'full'
  }

  ledgerStore.importData(backup)
  return 'legacy'
}
