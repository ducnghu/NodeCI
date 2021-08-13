const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

const exec = mongoose.Query.prototype.exec

const client = redis.createClient(keys.redisUrl)
client.hget = util.promisify(client.hget)

mongoose.Query.prototype.cache = function (options = {}) {
    this._cache = true
    this._hashKey = JSON.stringify(options.key || '')

    return this
}

mongoose.Query.prototype.exec = async function () {
    if (!this._cache) {
        return await exec.apply(this, arguments)
    }
    //console.log(this.getQuery());
    //console.log(this.mongooseCollection.name);
    const key = JSON.stringify(
        Object.assign(
            {}, 
            this.getQuery(), 
            {
                collection: this.mongooseCollection.name,
            },
        )
    )
    //console.log(key);
    const cache = await client.hget(this._hashKey, key)
    
    if (cache) {
        const doc = JSON.parse(cache)

        return Array.isArray(doc) 
        ? doc.map((d) => new this.model(d)) 
        : new this.model(doc)
    }

    const res = await exec.apply(this, arguments)
    client.hset(this._hashKey, key, JSON.stringify(res))
    return res
}

module.exports = {
    clearHash(key) {
        client.del(JSON.stringify(key))
    }
}