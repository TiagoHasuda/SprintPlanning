import { Modal } from "discord-modals"

interface NewModalProps {
  customId: string
  title: string
}

export const newModal = (props: NewModalProps) => {
  return new Modal()
    .setCustomId(props.customId)
    .setTitle(props.title)
}
