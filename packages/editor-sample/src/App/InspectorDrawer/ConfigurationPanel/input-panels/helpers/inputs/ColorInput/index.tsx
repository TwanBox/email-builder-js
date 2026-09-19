import React from 'react';

import { TBrandColorKind } from '../../../../../../../documents/editor/brandTokens';

import BaseColorInput from './BaseColorInput';

type Props = {
  label: string;
  onChange: (value: string) => void;
  defaultValue: string;
  // Offer the end-client and organisation brand colour of this kind above the picker.
  brandOptions?: TBrandColorKind;
};
export default function ColorInput(props: Props) {
  return <BaseColorInput {...props} nullable={false} />;
}

type NullableProps = {
  label: string;
  onChange: (value: null | string) => void;
  defaultValue: null | string;
  brandOptions?: TBrandColorKind;
};
export function NullableColorInput(props: NullableProps) {
  return <BaseColorInput {...props} nullable />;
}
