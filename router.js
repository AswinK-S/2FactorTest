const express = require('express')
const route = express.Router()
const controller = require('./controller')

route.get('/',controller.home)
route.post('/register',controller.register)
route.post('/enable-2fa',controller.twoFactor)
route.post('/verify-2fa',controller.verify2fa)

module.exports = route