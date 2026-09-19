import React from 'react';

import { TStyle } from '../../../../../../documents/blocks/helpers/TStyle';

import SingleStylePropertyPanel from './SingleStylePropertyPanel';

type MultiStylePropertyPanelProps = {
  names: (keyof TStyle)[];
  value: TStyle | undefined | null;
  onChange: (style: TStyle) => void;
  // Offer the end-client and organisation brand colour for the background colour (Container, Image).
  brandBackgroundColor?: boolean;
};
export default function MultiStylePropertyPanel({
  names,
  value,
  onChange,
  brandBackgroundColor,
}: MultiStylePropertyPanelProps) {
  return (
    <>
      {names.map((name) => (
        <SingleStylePropertyPanel
          key={name}
          name={name}
          value={value || {}}
          onChange={onChange}
          brandBackgroundColor={brandBackgroundColor}
        />
      ))}
    </>
  );
}
