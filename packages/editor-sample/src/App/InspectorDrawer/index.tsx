import React from 'react';

import { Box, Drawer, Tab, Tabs } from '@mui/material';

import { setSidebarTab, useInspectorDrawerOpen, useSelectedSidebarTab } from '../../documents/editor/EditorContext';
import BaseSidebarPanel from './ConfigurationPanel/input-panels/helpers/BaseSidebarPanel';

import ConfigurationPanel from './ConfigurationPanel';
import StylesPanel from './StylesPanel';

export const INSPECTOR_DRAWER_WIDTH = 320;

export default function InspectorDrawer() {
  const selectedSidebarTab = useSelectedSidebarTab();
  const inspectorDrawerOpen = useInspectorDrawerOpen();

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'block-configuration':
        return <ConfigurationPanel />;
      case 'styles':
        return <StylesPanel />;
      case 'default-variables':
        return (
          <BaseSidebarPanel title='Standaard variabelen'>
            <div>
              <p>{"{{NAAM_PROSPECT}}"}</p>
              <p>{"{{EMAIL_PROSPECT}}"}</p>
              <p>{"{{NAAM_ACCOUNTMANAGER}}"}</p>
              <p>{"{{EMAIL_ACCOUNTMANAGER}}"}</p>
              <p>{"{{EMAIL_AFZENDER}}"}</p>
              <p>{"{{NAAM_AFSPRAAK}}"}</p>
              <p>{"{{STARTTIJD_AFSPRAAK}}"}</p>
              <p>{"{{EINDTIJD_AFSPRAAK}}"}</p>
              <p>{"{{DATUM_AFSPRAAK}}"}</p>
              <p>{"{{DATUM_AFSPRAAK_WEEKDAG}}"}</p>
              <p>{"{{DATUM_AFSPRAAK_UITGESCHREVEN}}"}</p>
              <p>{"{{AFSPRAAK_TIJDZONE}}"}</p>
              <p>{"{{NAAM_CAMPAGNE}}"}</p>
              <p>{"{{NOTITIE_VOOR_IEDEREEN}}"}</p>

            </div>
          </BaseSidebarPanel >
        )
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={inspectorDrawerOpen}
      sx={{
        width: inspectorDrawerOpen ? INSPECTOR_DRAWER_WIDTH : 0,
      }}
    >
      <Box sx={{ width: INSPECTOR_DRAWER_WIDTH, height: 49, borderBottom: 1, borderColor: 'divider' }}>
        <Box px={2}>
          <Tabs value={selectedSidebarTab} onChange={(_, v) => setSidebarTab(v)}>
            <Tab value="styles" label="Opmaak" />
            <Tab value="block-configuration" label="Bewerken" />
            <Tab value="default-variables" label="Variabelen" />
          </Tabs>
        </Box>
      </Box>
      <Box sx={{ width: INSPECTOR_DRAWER_WIDTH, height: 'calc(100% - 49px)', overflow: 'auto' }}>
        {renderCurrentSidebarPanel()}
      </Box>
    </Drawer>
  );
}
