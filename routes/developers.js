var express = require('express');
var router = express.Router();
var util = require('util');
var config = require('config');
var url = require('url');
var async = require('async');
var request = require('request');
var _ = require('underscore');
var moment = require('moment')
var github = require('../app_modules/github');
var alertIcons = require('../app_modules/alert-icons');
// var users = require('../models/users');

var errorHandler = require('../app_modules/error');
var users = require('../models/users');
var repos = require('../models/repos');

router.get('/repos',function(req,res,next){
	async.parallel([
		function(callback){
			github.getUserRepos(req.session.user.github.access_token,function(err,repos){
				callback(err,repos)
			})
		},
		function(callback){
			repos.getUserRepos(req.db,req.session.user._id.toString(),function(err,repos){
				callback(err,repos)
			})
		}
	],function(err,results){
		if(err){
 			errorHandler.error(req,res,next,err);
 		}else{
 			render(req,res,'developers/repos',{
				user_repos: results[0],
				supporting_repos: results[1]
			})
 		}
	})

})


router.post('/support-repo',function(req,res,next){

	async.waterfall([
		function(callback){
			github.hookRepo(req.session.user.github.access_token,req.body.repo,function(err,hook){
				callback(err,hook)
			})
		},
		function(hook,callback){
			github.createLabel(req.session.user.github.access_token,req.body.repo,function(err,label){
				callback(err,hook)
			})
		},
		function(hook,callback){
			github.getRepo(req.session.user.github.access_token,req.body.repo,function(err,repo){
				callback(err,hook,repo)
			})
		},
		function(hook,repo,callback){
			repos.add(req.db,req.session.user._id.toString(),repo,req.body.price,hook,function(err,repo){
				callback(err,repo)
			})
		}
		/*
		1. create the web hook so we be notified to comments and pull requests coming from paying users
		2. save it in the db along with the price and other definitions of the developer
		3. add a badge to the readme file of the repo? or at least send a pull request, the way gitter did
		4. also let the user know the permalink for this, i.e. http://esos.io/subscribe/shaharsol/commandcar
		*/
	],function(err,repo){
		if(err){
 			errorHandler.error(req,res,next,err);
 		}else{
			req.session.alert = {
				type: 'success',
				message: util.format('Repository %s can now accept subscriptions',req.body.repo)
			};
 			res.redirect('/developers/repos')
 		}
	})




})


router.post('/remove-repo-support',function(req,res,next){
	async.waterfall([
		function(callback){
			repos.getByUserAndFullName(req.db,req.session.user._id.toString(),req.body.repo,function(err,repo){
				callback(err,repo)
			})
		},
		function(repo,callback){
			github.unhookRepo(req.session.user.github.access_token,req.body.repo,repo.hook_id,function(err){
				callback(err)
			})
		},
		function(callback){
			github.removeLabel(req.session.user.github.access_token,req.body.repo,function(err){
				callback(err)
			})
		},
		function(callback){
			repos.remove(req.db,req.session.user._id.toString(),req.body.repo,function(err,user){
				callback(err)
			})
		}
/*
TBD TBD
need to stop payments from all clients
*/
	],function(err){
		if(err){
 			errorHandler.error(req,res,next,err);
 		}else{
			req.session.alert = {
				type: 'success',
				message: util.format('Repository %s is no longer supported',req.body.repo)
			};
 			res.redirect('/developers/repos')
 		}
	})
})

function render(req,res,template,params){

	// params.user = req.session.user;
//	params.alert = req.session.alert;
//	delete req.session.alert;

	params.app = req.app;
	params._ = _;
	// params.us = us;
	params.moment = moment;
	params.config = config;
	params.util = util;

	params.alertIcons = alertIcons;
	params.alert = req.session.alert;
	delete req.session.alert;

	params.user = req.session.user;

	if(!('active_page' in params)){
		params.active_page = false;
	}

	if(!('isHomepage' in params)){
		params.isHomepage = false;
	}

	res.render(template,params);
}
module.exports = router;
