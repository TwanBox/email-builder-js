import { z } from 'zod';

import { ContainerPropsSchema as BaseContainerPropsSchema } from '@usewaypoint/block-container';

const ContainerPropsSchema = z.object({
  style: BaseContainerPropsSchema.shape.style,
  props: z
    .object({
      childrenIds: z.array(z.string()).optional().nullable(),
      // A branding bar: the coloured strip above or below a mail. `visible` is a boolean, or the
      // layout token of the campaign or organisation the bar follows (documents/editor/brandTokens.ts).
      brandingBar: z.enum(['header', 'footer']).optional().nullable(),
      visible: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export default ContainerPropsSchema;

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;
