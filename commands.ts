import { Modal, ModalSubmitInteraction, showModal } from "discord-modals"
import {
  Client,
  Interaction,
  Message,
  MessageActionRow,
  TextInputComponent,
} from "discord.js"
import { newButton } from "./button"
import { Data } from "./data"
import { newModal } from "./modal"
import { newTextInput } from "./textInput"

export const onHelp = async (msg: Message) => {
  const row = new MessageActionRow().addComponents(
    newButton({ label: "Start", customId: "btn_start", style: "SUCCESS" }),
    newButton({ label: "Change history", customId: "btn_change" }),
    newButton({ label: "Reveal", customId: "btn_reveal" }),
    newButton({ label: "Finish", customId: "btn_finish", style: "DANGER" })
  )
  await msg.channel.send({
    content:
      "Use **Start** to start the planning\nUse **Change history** to change the current history\nUse **Reveal** to reveal the current estimate\nUse **Finish** to finish the planning",
    components: [row],
  })
}

export const onStart = async (msg: Message) => {
  const [numberOfPlayers, options] = msg.content
    .replace(/^[^\s]*\s(\d+)\s([\d,]+)$/, "$1-$2")
    .split("-")
  if (!numberOfPlayers || !options) {
    await msg.channel.send(
      "Invalid use of `!start`, usage example:\n!start 5 1,2,3,4,5\n!start [numberOfPlayers] [list of options]\n**Only integer numbers**"
    )
    return
  }

  const optionsArray = options.split(",")
  if (optionsArray.length > 15) {
    await msg.channel.send("Maximum number of options is 15")
    return
  }

  const data = Data.getData()
  const res = data.startGame({
    channelId: msg.channelId,
    userId: msg.author.id,
    numberOfPlayers: parseInt(numberOfPlayers),
    options: optionsArray.map((option) => parseInt(option)),
  })

  if (typeof res === "string") {
    await msg.reply("Error: " + res)
    return
  }
  const row = new MessageActionRow().addComponents(
    newButton({
      label: "Start",
      customId: "btn_start",
      style: "SUCCESS",
      disabled: true,
    }),
    newButton({ label: "Change history", customId: "btn_change" }),
    newButton({ label: "Reveal", customId: "btn_reveal" }),
    newButton({ label: "Finish", customId: "btn_finish", style: "DANGER" })
  )
  await msg.reply({
    content: "Started",
    components: [row],
  })
  const userOptions = [
    new MessageActionRow().addComponents(
      optionsArray.slice(0, 5).map((option) =>
        newButton({
          label: option,
          customId: `btn_option_${option}`,
          disabled: true,
        })
      )
    ),
  ]

  if (optionsArray.length > 5)
    userOptions.push(
      new MessageActionRow().addComponents(
        optionsArray.slice(5, 10).map((option) =>
          newButton({
            label: option,
            customId: `btn_option_${option}`,
            disabled: true,
          })
        )
      )
    )

  if (optionsArray.length > 10)
    userOptions.push(
      new MessageActionRow().addComponents(
        optionsArray.slice(10, 15).map((option) =>
          newButton({
            label: option,
            customId: `btn_option_${option}`,
            disabled: true,
          })
        )
      )
    )

  const chMsg = await msg.channel.send({
    content: "```Awaiting first history...```",
    components: userOptions,
  })
  data.changeMessageId(msg.channelId, chMsg.id)
}

export const onStartButton = async (interaction: Interaction) => {
  if (!interaction.isButton()) return
  await interaction.reply({
    ephemeral: true,
    content:
      "To start use the command:\n```!start [numberOfPlayers] [options(Ex.: 1,2,3,4)]```",
  })
}

export const onChangeHistory = async (
  client: Client,
  interaction: Interaction
) => {
  if (!interaction.isButton()) return
  const data = Data.getData()
  if (!interaction.channelId)
    return interaction.reply({ ephemeral: true, content: "Invalid command" })
  const game = data.findGame(interaction.channelId)
  if (!game || game.responsable !== interaction.user.id)
    return interaction.reply({ ephemeral: true, content: "You can't do that" })
  const modal = newModal({
    customId: "modal_history",
    title: "Change history",
  })
  modal.addComponents(
    newTextInput({
      customId: "txt_history",
      label: "History",
      placeholder: "Your history goes here",
    })
  )
  showModal(modal, {
    client,
    interaction,
  })
}

export const onHistoryModalResponse = async (modal: ModalSubmitInteraction) => {
  const data = Data.getData()
  const newHistory = modal.getTextInputValue("txt_history")
  const res = data.changeHistory({
    channelId: modal.channelId,
    newHistory,
    userId: modal.member.id,
  })
  if (typeof res === "string")
    await modal.reply({ ephemeral: true, content: res })
  else {
    const userOptions = [
      new MessageActionRow().addComponents(
        res.options.slice(0, 5).map((option) =>
          newButton({
            label: option.toString(),
            customId: `btn_option_${option}`,
            disabled: true,
          })
        )
      ),
    ]

    if (res.options.length > 5)
      userOptions.push(
        new MessageActionRow().addComponents(
          res.options.slice(5, 10).map((option) =>
            newButton({
              label: option.toString(),
              customId: `btn_option_${option}`,
              disabled: true,
            })
          )
        )
      )

    if (res.options.length > 10)
      userOptions.push(
        new MessageActionRow().addComponents(
          res.options.slice(10, 15).map((option) =>
            newButton({
              label: option.toString(),
              customId: `btn_option_${option}`,
              disabled: true,
            })
          )
        )
      )

    const messageToSend = {
      content: `\`\`\`${res.current}\`\`\``,
      components: userOptions,
    }
    const findMessage = modal.channel?.messages.cache.find(
      (message) => message.id === res.messageId
    )
    if (!!findMessage) await findMessage.edit(messageToSend)
    else {
      const newMessage = await modal.channel?.send(messageToSend)
      if (!!newMessage) data.changeMessageId(modal.channelId, newMessage.id)
    }
    await modal.reply({ ephemeral: true, content: "History changed" })
  }
}

export const onVote = async (interaction: Interaction) => {
  if (!interaction.isButton()) return
  const data = Data.getData()
  const res = data.vote({
    channelId: interaction.channelId,
    userId: `${interaction.user.username}#${interaction.user.discriminator}`,
    vote: parseInt(interaction.component.label as string),
  })
  if (typeof res === "string")
    return interaction.reply({ ephemeral: true, content: res })

  const userOptions = [
    new MessageActionRow().addComponents(
      res.options.slice(0, 5).map((option) =>
        newButton({
          label: option.toString(),
          customId: `btn_option_${option}`,
          disabled: true,
        })
      )
    ),
  ]

  if (res.options.length > 5)
    userOptions.push(
      new MessageActionRow().addComponents(
        res.options.slice(5, 10).map((option) =>
          newButton({
            label: option.toString(),
            customId: `btn_option_${option}`,
            disabled: true,
          })
        )
      )
    )

  if (res.options.length > 10)
    userOptions.push(
      new MessageActionRow().addComponents(
        res.options.slice(10, 15).map((option) =>
          newButton({
            label: option.toString(),
            customId: `btn_option_${option}`,
            disabled: true,
          })
        )
      )
    )

  let content = `\`\`\`${res.current}\`\`\`\`\`\`Voted:`
  content += Object.keys(res.card.votes).reduce(
    (prev, curr) => "\n" + prev + curr + "",
    ""
  )
  if (Object.keys(res).includes("average"))
    content += `\n\`\`\`\`\`\`${(res as any).average.toString()}`

  content += "```"
  const messageToSend = {
    content,
    components: userOptions,
  }
  const findMessage = interaction.channel?.messages.cache.find(
    (message) => message.id === res.messageId
  )
  if (!!findMessage) await findMessage.edit(messageToSend)
  else {
    const newMessage = await interaction.channel?.send(messageToSend)
    if (!!newMessage) data.changeMessageId(interaction.channelId, newMessage.id)
  }
  await interaction.reply({
    ephemeral: true,
    content: `Voted for ${interaction.component.label}`,
  })
}

export const onReveal = async (interaction: Interaction) => {
  if (!interaction.isButton()) return
  const data = Data.getData()
  const res = data.getGame({
    channelId: interaction.channelId,
    userId: interaction.user.id,
  })

  if (typeof res === "string")
    return interaction.reply({ ephemeral: true, content: res })

    const userOptions = [
      new MessageActionRow().addComponents(
        res.options.slice(0, 5).map((option) =>
          newButton({
            label: option.toString(),
            customId: `btn_option_${option}`,
            disabled: true,
          })
        )
      ),
    ]
  
    if (res.options.length > 5)
      userOptions.push(
        new MessageActionRow().addComponents(
          res.options.slice(5, 10).map((option) =>
            newButton({
              label: option.toString(),
              customId: `btn_option_${option}`,
              disabled: true,
            })
          )
        )
      )
  
    if (res.options.length > 10)
      userOptions.push(
        new MessageActionRow().addComponents(
          res.options.slice(10, 15).map((option) =>
            newButton({
              label: option.toString(),
              customId: `btn_option_${option}`,
              disabled: true,
            })
          )
        )
      )
  let content = `\`\`\`${res.current}\`\`\`\`\`\`Voted:`
  content += Object.keys(res.card.votes).reduce(
    (prev, curr) => "\n" + prev + curr + "",
    ""
  )
  if (Object.keys(res).includes("average"))
    content += `\n\`\`\`\`\`\`${(res as any).average.toString()}`

  content += "```"
  const messageToSend = {
    content,
    components: userOptions,
  }
  const findMessage = interaction.channel?.messages.cache.find(
    (message) => message.id === res.messageId
  )
  if (!!findMessage) await findMessage.edit(messageToSend)
  else {
    const newMessage = await interaction.channel?.send(messageToSend)
    if (!!newMessage) data.changeMessageId(interaction.channelId, newMessage.id)
  }
  await interaction.reply({
    ephemeral: true,
    content: `Revealed`,
  })
}

export const onFinish = async (interaction: Interaction) => {
  if (!interaction.isButton()) return

  const data = Data.getData()
  const res = data.finishGame({
    channelId: interaction.channelId,
    userId: interaction.user.id,
  })

  if (typeof res === "string")
    return interaction.reply({ ephemeral: true, content: res })

  const findMessage = interaction.channel?.messages.cache.find(
    (message) => message.id === res.messageId
  )
  if (!!findMessage) await findMessage.delete()

  let content = "```Finished, results follow:```"
  res.cards.forEach((card) => {
    const usrs = Object.keys(card.votes)
    const sum = usrs.reduce((prev, curr) => prev + card.votes[curr], 0)
    content += `\`\`\`Description: ${card.description}\nAverage: ${
      sum / usrs.length
    }\`\`\``
  })
  await interaction.channel?.send(content)
  await interaction.channel?.messages.cache
    .find((message) => message.id === interaction.message.id)
    ?.delete()
  await interaction.deferUpdate()
}
