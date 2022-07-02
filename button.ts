import { MessageButton, MessageButtonStyleResolvable } from "discord.js"

interface NewButtonProps {
  label: string
  customId: string
  disabled?: boolean
  style?: MessageButtonStyleResolvable
}

export const newButton = ({
  customId,
  label,
  disabled = false,
  style = 'PRIMARY',
}: NewButtonProps) => {
  return new MessageButton()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled)
}
