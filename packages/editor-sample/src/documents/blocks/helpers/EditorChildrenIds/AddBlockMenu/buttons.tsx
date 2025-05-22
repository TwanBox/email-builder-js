import React from 'react';

import {
  AccountCircleOutlined,
  Crop32Outlined,
  HMobiledataOutlined,
  HorizontalRuleOutlined,
  HtmlOutlined,
  ImageOutlined,
  LibraryAddOutlined,
  NotesOutlined,
  SmartButtonOutlined,
  ViewColumnOutlined,
} from '@mui/icons-material';

import { TEditorBlock } from '../../../../editor/core';

type TButtonProps = {
  label: string;
  icon: JSX.Element;
  block: () => TEditorBlock;
};

export const BUTTONS: TButtonProps[] = [
  {
    label: 'heading',
    icon: <HMobiledataOutlined />,
    block: () => ({
      type: 'Heading',
      data: {
        props: { text: 'Hallo' },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
        },
      },
    }),
  },
  {
    label: 'text',
    icon: <NotesOutlined />,
    block: () => ({
      type: 'Text',
      data: {
        props: { text: 'Mijn nieuwe tekstblok' },
        style: {
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
          fontWeight: 'normal',
        },
      },
    }),
  },

  {
    label: 'button',
    icon: <SmartButtonOutlined />,
    block: () => ({
      type: 'Button',
      data: {
        props: {
          text: 'Knop',
          url: 'https://www.telecalendar.com'
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'image',
    icon: <ImageOutlined />,
    block: () => ({
      type: 'Image',
      data: {
        props: {
          url: 'https://fakeimg.pl/600x400',
          alt: 'Voorbeeld afbeelding',
          contentAlignment: 'middle',
          linkHref: null,
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'avatar',
    icon: <AccountCircleOutlined />,
    block: () => ({
      type: 'Avatar',
      data: {
        props: {
          imageUrl: 'https://ui-avatars.com/api/?size=128',
          shape: 'circle',
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'divider',
    icon: <HorizontalRuleOutlined />,
    block: () => ({
      type: 'Divider',
      data: {
        style: { padding: { top: 16, right: 0, bottom: 16, left: 0 } },
        props: {
          lineColor: '#CCCCCC',
        },
      },
    }),
  },
  {
    label: 'spacer',
    icon: <Crop32Outlined />,
    block: () => ({
      type: 'Spacer',
      data: {},
    }),
  },
  {
    label: 'html',
    icon: <HtmlOutlined />,
    block: () => ({
      type: 'Html',
      data: {
        props: { contents: '<strong>Hello world</strong>' },
        style: {
          fontSize: 16,
          textAlign: null,
          padding: { top: 16, bottom: 16, left: 24, right: 24 },
        },
      },
    }),
  },
  {
    label: 'columns',
    icon: <ViewColumnOutlined />,
    block: () => ({
      type: 'ColumnsContainer',
      data: {
        props: {
          columnsGap: 16,
          columnsCount: 3,
          columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }],
        },
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },
  {
    label: 'container',
    icon: <LibraryAddOutlined />,
    block: () => ({
      type: 'Container',
      data: {
        style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
      },
    }),
  },

  // { label: 'ProgressBar', icon: <ProgressBarOutlined />, block: () => ({}) },
  // { label: 'LoopContainer', icon: <ViewListOutlined />, block: () => ({}) },
];
