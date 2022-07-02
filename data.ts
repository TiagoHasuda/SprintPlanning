interface Card {
  description: string
  votes: { [key: string]: number }
}

interface PlanningGame {
  responsable: string
  channelId: string
  numberOfPlayers: number
  options: number[]
  cards: Card[]
  current: string
  messageId: string
  voting: boolean
}

interface NewGameProps {
  userId: string
  channelId: string
  numberOfPlayers: number
  options: number[]
}

interface ChangeHistoryProps {
  userId: string
  channelId: string
  newHistory: string
}

interface VoteProps {
  channelId: string
  userId: string
  vote: number
}

interface FinishGameProps {
  channelId: string
  userId: string
}

interface GetGameProps {
  channelId: string
  userId: string
}

export class Data {
  private static _curr: Data
  private _games: PlanningGame[] = []

  private constructor() {}

  static getData() {
    if (!Data._curr) Data._curr = new Data()
    return Data._curr
  }

  findGame(channelId: string): PlanningGame | undefined {
    return this._games.find((game) => game.channelId === channelId)
  }

  startGame(props: NewGameProps): string | null {
    const exists = this.findGame(props.channelId)
    if (!!exists) return "Game already running"
    this._games.push({
      channelId: props.channelId,
      responsable: props.userId,
      current: "Awaiting first history...",
      cards: [],
      options: props.options,
      numberOfPlayers: props.numberOfPlayers,
      voting: false,
      messageId: "",
    })
    return null
  }

  changeMessageId(channelId: string, messageId: string) {
    const exists = this.findGame(channelId)
    if (!exists) return
    exists.messageId = messageId
  }

  changeHistory(props: ChangeHistoryProps): string | PlanningGame {
    const exists = this.findGame(props.channelId)
    if (!exists) return "Game not running"
    if (exists.responsable !== props.userId)
      return "You're not in charge of this game"
    const cardExists = exists.cards.some(
      (card) => card.description === props.newHistory
    )
    if (cardExists) return "This description was already used"
    exists.current = props.newHistory
    exists.voting = true
    return exists
  }

  vote(
    props: VoteProps
  ):
    | string
    | (PlanningGame & { card: Card })
    | (PlanningGame & { average: number; card: Card }) {
    const game = this.findGame(props.channelId)
    if (!game) return "Game not running"
    if (!game.voting) return "Voting is closed"
    let card = game.cards.find((card) => card.description === game.current)
    if (!card) {
      game.cards.push({
        description: game.current,
        votes: {},
      })
      card = game.cards[game.cards.length - 1]
    }
    card.votes[props.userId] = props.vote
    const playersCount = Object.keys(card.votes).length
    if (playersCount >= game.numberOfPlayers)
      return {
        average:
          Object.keys(card.votes).reduce(
            (prev, curr) => prev + (card as Card).votes[curr],
            0
          ) / playersCount,
        ...game,
        card,
      }
    return { ...game, card }
  }

  finishGame(props: FinishGameProps): string | PlanningGame {
    const game = this.findGame(props.channelId)
    if (!game) return "Game not running"
    if (game.responsable !== props.userId)
      return "You're not in charge of this game"
    const copy = { ...game }
    const index = this._games.findIndex(
      (game) => game.channelId === props.channelId
    )
    this._games.splice(index, 1)
    return copy
  }

  getGame(
    props: GetGameProps
  ): string | (PlanningGame & { average: number; card: Card }) {
    const game = this.findGame(props.channelId)
    if (!game) return "Game not running"
    if (game.responsable != props.userId)
      return "You're not in charge of this game"
    if (!game.voting) return "Voting is closed"
    const card = game.cards.find((card) => card.description === game.current)
    if (!card) return "Current history not found"
    const players = Object.keys(card.votes)
    return {
      ...game,
      average:
        players.reduce((prev, curr) => prev + card.votes[curr], 0) /
        players.length,
      card,
    }
  }
}
