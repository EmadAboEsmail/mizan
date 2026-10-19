import { useZekrData } from '@/context/ZekrDataContext'
import SettingsTab from '@/components/zekr_app/settings/SettingsTab.jsx'

function ZekrSettings() {
  const {
    allAdhkar,
    groups,
    handleDeleteAllCounts,
    handleDeleteAllTargets,
    handleDeleteAllClicks,
    handleDeleteAll,
    handleAddAdhkar,
    handleUpdateAdhkar,
    handleDeleteAdhkar,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAddGroupItem,
    handleUpdateGroupItem,
    handleDeleteGroupItem,
    handleExportBackup,
    handleImportBackup,
  } = useZekrData()

  return (
    <SettingsTab
      adhkar={allAdhkar}
      onDeleteCounts={handleDeleteAllCounts}
      onDeleteTargets={handleDeleteAllTargets}
      onDeleteClicks={handleDeleteAllClicks}
      onDeleteAll={handleDeleteAll}
      onAddAdhkar={handleAddAdhkar}
      onUpdateAdhkar={handleUpdateAdhkar}
      onDeleteAdhkar={handleDeleteAdhkar}
      groups={groups}
      onAddGroup={handleAddGroup}
      onUpdateGroup={handleUpdateGroup}
      onDeleteGroup={handleDeleteGroup}
      onAddGroupItem={handleAddGroupItem}
      onUpdateGroupItem={handleUpdateGroupItem}
      onDeleteGroupItem={handleDeleteGroupItem}
      onExportBackup={handleExportBackup}
      onImportBackup={handleImportBackup}
    />
  )
}

export default ZekrSettings
