import bodyParser from 'body-parser'
import express from 'express'
import router from './controllers'
import * as botHandler from './handlers/bot'
import * as storeHandler from './handlers/store'
import * as cronUtil from './util/cron'
import * as vacationManager from './manager/vacation'

const port = process.env.PORT || 3000

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/api', router)
app.listen(port)

setupTeams()

cronUtil.startVacationStartCheckJob()
cronUtil.startVacationEndCheckJob()
async function setupTeams() {
  await storeHandler.init()
  await storeHandler.setupDevTeam()
  const tokens = await storeHandler.getAllTokens()
  botHandler.resumeAllConnections(tokens)
  const phrases = [
    'vacation',
    'holiday',
    'ooo',
    'time off',
    'out of office',
    /i(am|’m|'m') (off|out) (next|from) (\w+-\w+|\w+)(\sto\s\w+)?/gim,
    /(i|we)(\swill|'ll|’ll) be (out|off) (most of the|next) (day|week|month|year|time|couple of days)/gim,
    /(i|we)(\swill|'ll|’ll) be (out|off) (the day after\s)?tomorrow/gim,
    /(i|we)(\swill|'ll|’ll) be (out|off) in (\w+|\d+) days/gim,
    /(i|we)(\swill|'ll|’ll) be in \w+ (the|from|in|next) \w+|(\d+\w+)/gim,
    /(i|we)(\swill|'ll|’ll|\sneed to) take (some|a) time off/gim,
  ]
  botHandler.listener.hears(phrases, ['ambient'], (bot, message) => {
    botHandler.startVacationRequestConversation(bot, message.user)
    botHandler.markMessageWithEmoji(bot, message)
  })
  botHandler.listener.hears('@', ['ambient'], (bot, message) => {
    vacationManager.handleUserMention(message)
  })
}
