import React from 'react';

import { Box, Drawer, Tab, Tabs, Tooltip } from '@mui/material';

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

              <p>
                <Tooltip placement='left' title="HH:mm">
                  <span>{"{{STARTTIJD_AFSPRAAK}}"}</span>
                </Tooltip>
              </p>

              <p>
                <Tooltip placement='left' title="HH:mm">
                  <span>{"{{EINDTIJD_AFSPRAAK}}"}</span>
                </Tooltip>
              </p>

              <p>
                <Tooltip placement='left' title="DD-MM-YYYY">
                  <span>{"{{DATUM_AFSPRAAK}}"}</span>
                </Tooltip>
              </p>

              <p>
                <Tooltip placement='left' title="maandag">
                  <span>{"{{DATUM_AFSPRAAK_WEEKDAG}}"}</span>
                </Tooltip>
              </p>

              <p>
                <Tooltip placement='left' title="maandag 3 maart">
                  <span>{"{{DATUM_AFSPRAAK_UITGESCHREVEN}}"}</span>
                </Tooltip>
              </p>

              <p>
                <Tooltip placement='left' title="Europe/Amsterdam">
                  <span>{"{{AFSPRAAK_TIJDZONE}}"}</span>
                </Tooltip>
              </p>

              <p>{"{{NAAM_CAMPAGNE}}"}</p>

              <p>
                <Tooltip placement='left' title="Afspraak Beschrijving">
                  <span>{"{{NOTITIE_VOOR_IEDEREEN}}"}</span>
                </Tooltip>
              </p>

              <p>
                <Tooltip placement='left' title="Adres of Meeting link">
                  <span>{"{{LOCATIE_AFSPRAAK}}"}</span>
                </Tooltip>
              </p>

              <p>{"{{AFSPRAAK_VERPLAATS_URL}}"}</p>

              <p>{"{{AFSPRAAK_ANNULEER_URL}}"}</p>

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
