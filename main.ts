import { Client, Intents } from "discord.js"
import discordModals from 'discord-modals'
import { config } from "dotenv"
import { onInteraction, onMessage, onModalSubmit, onReady } from "./events"

;(async () => {
  config()

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  })

  discordModals(client)

  client.on("ready", onReady)

  client.on("messageCreate", onMessage)

  client.on("interactionCreate", (i) => onInteraction(client, i))

  client.on("modalSubmit", onModalSubmit)

  await client.login(process.env.TOKEN)
})()
