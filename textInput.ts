import { TextInputComponent, TextInputStyle } from "discord-modals"

interface NewTextInputProps {
  customId: string
  label: string
  placeholder?: string
  style?: TextInputStyle
  required?: boolean
}

export const newTextInput = ({
  customId,
  label,
  placeholder = '',
  style = 'SHORT',
  required = true,
}: NewTextInputProps) => {
  return new TextInputComponent()
    .setCustomId(customId)
    .setLabel(label)
    .setPlaceholder(placeholder)
    .setStyle(style)
    .setRequired(required)
}
