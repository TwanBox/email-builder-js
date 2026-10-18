import React from 'react';

import { TStyle } from '../../../../../../documents/blocks/helpers/TStyle';

import SingleStylePropertyPanel from './SingleStylePropertyPanel';

type MultiStylePropertyPanelProps = {
  names: (keyof TStyle)[];
  value: TStyle | undefined | null;
  onChange: (style: TStyle) => void;
  // Offer the end-client and organisation brand colour for the background colour (Container, Image).
  brandBackgroundColor?: boolean;
  // Let the top and bottom padding follow the logo padding of the campaign or organisation (Image).
  brandPadding?: boolean;
  // Let the background colour follow the campaign's or organisation's brand colour behind the logo (Image).
  brandLogoBackground?: boolean;
};
export default function MultiStylePropertyPanel({
  names,
  value,
  onChange,
  brandBackgroundColor,
  brandPadding,
  brandLogoBackground,
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
          brandPadding={brandPadding}
          brandLogoBackground={brandLogoBackground}
        />
      ))}
    </>
  );
}
