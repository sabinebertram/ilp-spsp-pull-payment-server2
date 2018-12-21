const uuid = require('uuid')
const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')
const BigNumber = require('bignumber.js')

const Config = require('../lib/config')

class TokenModel {
  constructor (deps) {
    this.config = deps(Config)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())

    // this.balanceCache = new Map()
    // this.writeQueue = Promise.resolve()
  }

  // async pay ({ id, amount }) {
  //   const invoice = await this.get(id)

  //   if (!this.balanceCache.get(id)) {
  //     this.balanceCache.set(id, invoice.balance)
  //   }

  //   const balance = new BigNumber(this.balanceCache.get(id))
  //   const newBalance = BigNumber.min(balance.plus(amount), invoice.amount)

  //   if (balance.isEqualTo(invoice.amount)) {
  //     throw new Error('This invoice has been paid')
  //   }

  //   let paid = false
  //   if (newBalance.isEqualTo(invoice.amount)) {
  //     paid = true
  //   }

  //   // TODO: debounce instead of writeQueue
  //   this.balanceCache.set(id, newBalance.toString())
  //   this.writeQueue = this.writeQueue.then(async () => {
  //     const loaded = await this.get(id)
  //     loaded.balance = newBalance.toString()
  //     return this.db.put(id, JSON.stringify(loaded))
  //   })

  //   return paid
  // }

  async pull ({ id, token }) {
    token.balance = BigNumber(token.balance).plus(BigNumber(token.amount))
    token.cooldown = BigNumber(token.cooldown).plus(BigNumber(token.interval).times(BigNumber(86400)))
    this.db.put(id, JSON.stringify(token))
  }

  async get (id) {
    return JSON.parse(await this.db.get(id))
  }

  async create ({ amount, maximum, interval, name, webhook }) {
    const id = uuid()

    await this.db.put(id, JSON.stringify({
      balance: String(0),
      amount,
      maximum,
      name,
      interval,
      cooldown: String(Date.now() / 1000 | 0),
      webhook
    }))

    return {
      id,
      receiver: '$' + this.config.host + '/' + id
    }
  }
}

module.exports = TokenModel
