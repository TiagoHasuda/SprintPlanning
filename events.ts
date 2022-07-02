import { ModalSubmitInteraction } from "discord-modals"
import { Client, Interaction, Message } from "discord.js"
import { onChangeHistory, onFinish, onHelp, onHistoryModalResponse, onReveal, onStart, onStartButton, onVote } from "./commands"

export const onReady = () => {
  console.log("Connected")
}

export const onMessage = async (msg: Message) => {
  if (!msg.content.startsWith("!")) return
  const command = msg.content.replace(/^!([^\s]*).*$/, "$1")
  switch (command) {
    case "help":
      await onHelp(msg)
      break
    case "start":
      await onStart(msg)
      break
  }
}

export const onInteraction = async (client: Client, interaction: Interaction) => {
  if (!interaction.isButton()) return
  switch (interaction.customId) {
    case 'btn_change':
      await onChangeHistory(client, interaction)
      break
    case 'btn_start':
      await onStartButton(interaction)
      break
    case interaction.customId.startsWith('btn_option_') ? interaction.customId : '':
      await onVote(interaction)
      break
    case 'btn_reveal':
      await onReveal(interaction)
      break
    case 'btn_finish':
      await onFinish(interaction)
      break
  }
}

export const onModalSubmit = async (modal: ModalSubmitInteraction) => {
  switch (modal.customId) {
    case 'modal_history':
      await onHistoryModalResponse(modal)
      break
  }
}
