import React from 'react';

import { Box, Drawer, Tab, Tabs, Tooltip } from '@mui/material';

import { brandTokensOfKind, tokenText } from '../../documents/editor/brandTokens';
import { STANDARD_VARIABLES, variableHint, variableText } from '../../documents/editor/standardVariables';
import { setSidebarTab, useBrand, useInspectorDrawerOpen, useSelectedSidebarTab } from '../../documents/editor/EditorContext';
import BaseSidebarPanel from './ConfigurationPanel/input-panels/helpers/BaseSidebarPanel';

import ConfigurationPanel from './ConfigurationPanel';
import StylesPanel from './StylesPanel';

import { useIntl } from 'react-intl';

export const INSPECTOR_DRAWER_WIDTH = 320;

export default function InspectorDrawer() {
  const selectedSidebarTab = useSelectedSidebarTab();
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const brand = useBrand();
  const t = useIntl()

  const renderCurrentSidebarPanel = () => {
    switch (selectedSidebarTab) {
      case 'block-configuration':
        return <ConfigurationPanel />;
      case 'styles':
        return <StylesPanel />;
      case 'default-variables':
        return (
          <BaseSidebarPanel title={t.formatMessage({ id: 'standardVariables' })}>
            <div>
              {/* Names follow the organisation's language; both languages always work when sent. */}
              {STANDARD_VARIABLES.map((variable) => {
                const text = variableText(variable, brand);
                const hint = variableHint(variable, brand);
                return (
                  <p key={variable.nl}>
                    {hint ? (
                      <Tooltip placement="left" title={hint}>
                        <span>{text}</span>
                      </Tooltip>
                    ) : (
                      text
                    )}
                  </p>
                );
              })}

              {brandTokensOfKind('logo').map((token) => (
                <p key={token.nl}>{tokenText(token, brand)}</p>
              ))}
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
            <Tab value="styles" label={t.formatMessage({ id: 'styles' })} />
            <Tab value="block-configuration" label={t.formatMessage({ id: 'edit' })} />
            <Tab value="default-variables" label={t.formatMessage({ id: 'variables' })} />
          </Tabs>
        </Box>
      </Box>
      <Box sx={{ width: INSPECTOR_DRAWER_WIDTH, height: 'calc(100% - 49px)', overflow: 'auto' }}>
        {renderCurrentSidebarPanel()}
      </Box>
    </Drawer>
  );
}
