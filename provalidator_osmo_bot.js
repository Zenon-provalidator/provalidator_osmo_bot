const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const session = require('telegraf/session')
const commandParts = require('telegraf-command-parts')//telegraf middleware
const logger = require('./log4js').log4js//logger
const CronJob = require('cron').CronJob
const func = require('./func')
require('dotenv').config()
const bot = new Telegraf(process.env.BOT_TOKEN, {username: process.env.BOT_ID})

//session
bot.use(session())
//commandParts
bot.use(commandParts())
////bot start
bot.startPolling()

let msgArr = new Array()//save msg array

//osmosis
bot.command('staking', (ctx) =>{
	//delete existing message
	if(typeof msgArr[ctx.chat.id] != 'undefined'){
		bot.telegram.deleteMessage(ctx.chat.id, msgArr[ctx.chat.id]).catch(err=>{
			logger.error(err)
		})
	}
	//show message
	ctx.reply(`Please wait..`).then((m) => {
		let msg = func.getMessage('osmosis')//get message
		msgArr[m.chat.id] = m.message_id
		//edit message
		bot.telegram.editMessageText(m.chat.id, m.message_id, m.message_id, msg, Extra.HTML()).catch(err=>{				
			logger.error(`=======================osmosis main1=======================`)
			logger.error(err)
			bot.telegram.editMessageText(m.chat.id, m.message_id, m.message_id, `Sorry! bot has error.`)
		})
	})
}).catch(err=>{
	//bot.reply(`Sorry! bot has error.`)
	logger.error(err)
})

bot.command('proposal', (ctx) =>{
	//delete existing message
	if(typeof msgArr[ctx.chat.id] != 'undefined'){
		bot.telegram.deleteMessage(ctx.chat.id, msgArr[ctx.chat.id]).catch(err=>{
			logger.error(err)
		})
	}
	//show message
	if(/[0-9]/.test(ctx.state.command.args)){
		ctx.reply(`Please wait..`).then((m) => {
			let msg = func.getProposal(ctx.state.command.args)//get proposal
			msgArr[m.chat.id] = m.message_id
			//edit message
			bot.telegram.editMessageText(m.chat.id, m.message_id, m.message_id, msg, { parse_mode: 'HTML', disable_web_page_preview : true}).catch(err=>{				
				logger.error(`=======================osmosis proposal1=======================`)
				logger.error(err)
				bot.telegram.editMessageText(m.chat.id, m.message_id, m.message_id, `Sorry! bot has error.`)
			})
		})
	}else {
		let latestProposal = func.getLatestProposalNum() //????????? ???????????? ?????? ????????????
		ctx.reply(`Please wait..`).then((m) => {
			let msg = func.getProposal(latestProposal)//get proposal
			msgArr[m.chat.id] = m.message_id
			//edit message
			bot.telegram.editMessageText(m.chat.id, m.message_id, m.message_id, msg, { parse_mode: 'HTML', disable_web_page_preview : true}).catch(err=>{				
				logger.error(`=======================osmosis proposal1=======================`)
				logger.error(err)
				bot.telegram.editMessageText(m.chat.id, m.message_id, m.message_id, `Sorry! bot has error.`)
			})
		})		
	}
})

//loop
const botJob = new CronJob(`*/60 * * * * *`, async function () {
	let latestProposal = func.getLatestProposalNum() //????????? ???????????? ?????? ????????????

	if(latestProposal !== 0 ){
		let callProposalNum = latestProposal+1
		let getProposal = func.getProposalFromServer(callProposalNum)
		
		if(typeof getProposal === "object"){
			let msg = `???? <b>??????????????? ($OSMO)</b>\n`
			msg += `??????????????????????????????????????????????????????\n\n`
			msg += `<b>???????????????? ??????????????? ??????????????????.</b>\n\n`
			msg += `#${callProposalNum} ${getProposal.title}\n\n`
			msg += `????<a href='https://www.mintscan.io/osmosis/proposals/${callProposalNum}'>https://www.mintscan.io/osmosis/proposals/${callProposalNum}</a>\n\n`
			msg += `<b>??????????????? $OSMO ???????????? ????????????</b>\n\n`
			msg += `??????????????????????????????????????????????????????\n`
			msg += `<b>????????????(<a href='https://provalidator.com'>Provalidator</a>) ????????? ??????</b>`				
			bot.telegram.sendMessage(process.env.PROPOSAL_ALERT_ROOM_ID, msg,{ parse_mode: 'HTML', disable_web_page_preview : true})
		} else if(getProposal === 203){
			logger.debug(`${callProposalNum} proposal is not found`)
		} else{
			logger.error(`server error`)
		}
	}else{
		logger.error(`latestProposal is 0`)
	}
	
}).start()